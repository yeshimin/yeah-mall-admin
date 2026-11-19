/**
 * 表格列容器归一化：同一列的所有数据行共用一个容器宽度，该宽度取「本列实际内容的最大宽度」
 * （不是列宽/表头宽），容器在列内水平居中，容器内的内容左对齐。
 * 宽度必须运行时按真实数据计算：写死的样例宽度在真实数据更短时会让整列看起来偏左。
 */

interface Target {
  scope: Element
  tbody: HTMLTableSectionElement
  containerSelector: string
}

const TYPE_COLUMN_RE = /--selection|--expand|--index|__expand-column/
/** 宽度写在自定义属性上，由 CSS 的 width:var(--ym-cw) !important 生效，避免被框架的内联 width 覆盖。 */
const WIDTH_VAR = '--ym-cw'

let applying = false
let frame = 0
let retryTimer = 0
let waitStart = 0
let observer: MutationObserver | null = null
let resizeObserver: ResizeObserver | null = null
const signatures = new WeakMap<HTMLTableSectionElement, string>()
const watched = new WeakSet<Element>()
const WAIT_LIMIT = 1500

function collect(): Target[] {
  const targets: Target[] = []
  for (const tbody of document.querySelectorAll('.el-table tbody')) {
    const scope = tbody.closest('.el-table')
    if (scope) targets.push({ scope, tbody: tbody as HTMLTableSectionElement, containerSelector: '.cell' })
  }
  for (const tbody of document.querySelectorAll('table.sa-sku-table tbody')) {
    const scope = tbody.closest('table')
    if (scope) targets.push({ scope, tbody: tbody as HTMLTableSectionElement, containerSelector: '.sa-cb' })
  }
  return targets
}

function isTypeColumn(th: Element | null, td: Element, cell: HTMLElement): boolean {
  if (TYPE_COLUMN_RE.test(`${th?.className ?? ''} ${td.className}`)) return true
  // 树表首列也带展开图标，只有「无文本」的纯控件列才是选择/展开列。
  return !(cell.textContent || '').trim() && !!cell.querySelector('.el-checkbox, .el-radio, .el-table__expand-icon')
}

/** 单元格内容可用宽度（avail）与盒模型 padding+border（box）。 */
function measure(cell: HTMLElement): { avail: number; box: number } {
  const cs = getComputedStyle(cell)
  const padL = parseFloat(cs.paddingLeft) || 0
  const padR = parseFloat(cs.paddingRight) || 0
  const borL = parseFloat(cs.borderLeftWidth) || 0
  const borR = parseFloat(cs.borderRightWidth) || 0
  const rect = cell.getBoundingClientRect()
  const left = rect.left + borL + padL
  const right = rect.right - borR - padR
  return {
    avail: Math.max(0, right - left),
    box: padL + padR + borL + borR,
  }
}

/**
 * 视觉原子计数：一个原子 = 一段文本 / 一张图 / 一个标签 / 一个开关 / 一个按钮。
 * 上下堆叠（名称+描述、日期+时间）或横向多控件算多个原子。
 * 纯装饰（空 <i> 圆点、占位 span）不计；CopyableText 是单个文本按钮，自然算一个原子。
 * 列分类按「本列任意一行 >=2 个原子即多元素列」，只需判断是否 >=2，提前退出。
 */
const ATOMIC_TAGS = new Set(['IMG', 'SVG', 'CANVAS', 'VIDEO', 'AUDIO', 'INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'IFRAME', 'OBJECT', 'EMBED', 'PICTURE'])
const ATOMIC_SELECTOR = '.el-avatar,.avatar,.el-image,.el-switch,.el-tag,.el-checkbox,.el-radio,.el-rate,.el-progress,.el-icon,.el-badge,.el-button,.copyable-text,.copyable-value,.status-ticket,.merchant-account-status,.sa-status'
const MEDIA_SELECTOR = 'img,svg,canvas,video,input,button,select,textarea,.el-avatar,.avatar,.el-image,.el-switch,.el-checkbox,.el-radio,.el-icon'

function isAtomic(el: HTMLElement): boolean {
  return ATOMIC_TAGS.has(el.tagName.toUpperCase()) || el.matches(ATOMIC_SELECTOR)
}

function isHiddenEl(el: HTMLElement): boolean {
  const cs = getComputedStyle(el)
  return cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed'
}

function isEmptyDecoration(el: HTMLElement): boolean {
  if ((el.textContent || '').trim()) return false
  return !el.querySelector(MEDIA_SELECTOR)
}

function countAtoms(node: Node): number {
  let atoms = 0
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      if ((child.textContent || '').trim()) atoms += 1
      continue
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue
    const el = child as HTMLElement
    if (isHiddenEl(el)) continue
    if (isAtomic(el)) { atoms += 1 }
    else if (!isEmptyDecoration(el)) atoms += countAtoms(el)
    if (atoms >= 2) return atoms
  }
  return atoms
}

/** 单行自然文本宽度（不受表格布局/换行影响），用于判断单元素列内容是否超长需要截断。 */
let textProbe: HTMLSpanElement | null = null
function naturalTextWidth(cell: HTMLElement): number {
  const text = (cell.textContent || '').trim()
  if (!text) return 0
  if (!textProbe) {
    textProbe = document.createElement('span')
    textProbe.style.position = 'absolute'
    textProbe.style.visibility = 'hidden'
    textProbe.style.pointerEvents = 'none'
    textProbe.style.left = '-99999px'
    textProbe.style.top = '0'
    textProbe.style.whiteSpace = 'nowrap'
    textProbe.style.width = 'auto'
    textProbe.style.maxWidth = 'none'
    document.body.appendChild(textProbe)
  }
  const cs = getComputedStyle(cell)
  textProbe.style.fontSize = cs.fontSize
  textProbe.style.fontFamily = cs.fontFamily
  textProbe.style.fontWeight = cs.fontWeight
  textProbe.style.fontStyle = cs.fontStyle
  textProbe.style.letterSpacing = cs.letterSpacing
  textProbe.style.fontVariantNumeric = cs.fontVariantNumeric
  textProbe.style.textTransform = cs.textTransform
  textProbe.textContent = text
  return textProbe.getBoundingClientRect().width
}

/**
 * 探针挂在 body 下，拿不到 #app / 页面祖先作用域里的字体规则（如 #app b{font-weight:600}、
 * 继承的 tabular-nums），克隆体会按错误字重/字形量宽，导致容器偏窄、最长文本被假截断。
 * 逐元素把渲染态 computed 字体同步到克隆体，使探针字形与真实渲染完全一致，与作用域无关。
 */
const FONT_PROPS = ['fontSize', 'fontFamily', 'fontWeight', 'fontStyle', 'letterSpacing', 'fontVariantNumeric', 'textTransform', 'wordSpacing'] as const
function syncFont(source: Element, clone: Element): void {
  const cs = getComputedStyle(source)
  const el = clone as HTMLElement
  for (const prop of FONT_PROPS) el.style[prop] = cs[prop]
  const srcKids = source.children
  const cloneKids = clone.children
  for (let i = 0; i < srcKids.length; i += 1) {
    const src = srcKids[i]
    const dst = cloneKids[i]
    if (src && dst) syncFont(src, dst)
  }
}

/**
 * 多元素列内容的自然宽度：把单元格内容克隆到离屏探针，放开块级子元素的固定宽/max-width，
 * 让 flex 复合块收缩到「内容真正需要的宽度」。渲染态的 extent 会被 max-width:100% 压到≈列内容宽，
 * 窄列里永远填满而无法居中；自然宽才能算出可居中的容器宽。
 */
let blockProbe: HTMLDivElement | null = null
function naturalContentWidth(cell: HTMLElement): number {
  if (!blockProbe) {
    blockProbe = document.createElement('div')
    blockProbe.style.position = 'absolute'
    blockProbe.style.visibility = 'hidden'
    blockProbe.style.pointerEvents = 'none'
    blockProbe.style.left = '-99999px'
    blockProbe.style.top = '0'
    blockProbe.style.whiteSpace = 'nowrap'
    blockProbe.style.width = 'auto'
    blockProbe.style.maxWidth = 'none'
    document.body.appendChild(blockProbe)
  }
  const cs = getComputedStyle(cell)
  blockProbe.style.fontSize = cs.fontSize
  blockProbe.style.fontFamily = cs.fontFamily
  blockProbe.style.fontWeight = cs.fontWeight
  blockProbe.style.fontStyle = cs.fontStyle
  blockProbe.style.letterSpacing = cs.letterSpacing
  blockProbe.style.fontVariantNumeric = cs.fontVariantNumeric
  blockProbe.style.textTransform = cs.textTransform
  blockProbe.style.lineHeight = cs.lineHeight
  blockProbe.innerHTML = ''
  let has = false
  for (const child of Array.from(cell.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE && !(child.textContent || '').trim()) continue
    const clone = child.cloneNode(true)
    if (clone.nodeType === Node.ELEMENT_NODE) {
      const el = clone as HTMLElement
      el.style.width = 'auto'
      el.style.maxWidth = 'none'
      syncFont(child as Element, el)
    }
    blockProbe.appendChild(clone)
    has = true
  }
  return has ? blockProbe.getBoundingClientRect().width : 0
}

interface Column {
  cells: HTMLElement[]
  type: boolean
  single: boolean
  width: string | null
}

function normalize({ scope, tbody, containerSelector }: Target): void {
  const rows = Array.from(tbody.children).filter(
    (row): row is HTMLTableRowElement => row.tagName === 'TR' && (row as HTMLElement).getClientRects().length > 0,
  )
  const firstRow = rows[0]
  if (!firstRow) return

  const columnCount = firstRow.children.length
  const headers = Array.from(scope.querySelectorAll('thead th'))
  const columns: Column[] = Array.from({ length: columnCount }, () => ({ cells: [], type: false, single: false, width: null }))

  for (const row of rows) {
    if (row.children.length !== columnCount) continue
    const rowRect = row.getBoundingClientRect()
    if (rowRect.width <= 0 || rowRect.height <= 0) continue
    for (const [k, td] of Array.from(row.children).entries()) {
      if (td.tagName !== 'TD') continue
      const column = columns[k]
      if (!column) continue
      const cell = td.querySelector<HTMLElement>(`:scope > ${containerSelector}`)
      if (!cell) continue
      column.cells.push(cell)
      if (!column.type) column.type = isTypeColumn(headers[k] ?? null, td, cell)
    }
  }

  // 列分类：本列任意一行有 >=2 个视觉原子 → 多元素列（容器等宽居中 + 内容左对齐）；
  // 否则单元素列（纯居中，超长截断）。
  for (const column of columns) {
    if (column.type || !column.cells.length) continue
    let multi = false
    for (const cell of column.cells) {
      if (countAtoms(cell) >= 2) { multi = true; break }
    }
    column.single = !multi
  }

  // 测量前必须先放开宽度：容器带着上一次的固定宽去量，会收缩反馈成越来越小的假值。
  for (const column of columns) {
    if (column.type) continue
    for (const cell of column.cells) {
      if (cell.style.getPropertyValue(WIDTH_VAR) !== 'auto') cell.style.setProperty(WIDTH_VAR, 'auto')
    }
  }
  void tbody.offsetWidth

  // 多元素列：同列共用「本列内容自然最大宽度」的容器，容器列内居中、内容左对齐。
  for (const column of columns) {
    if (column.type || column.single || !column.cells.length) continue
    let natural = 0
    let avail = Number.POSITIVE_INFINITY
    let box = 0
    for (const cell of column.cells) {
      const m = measure(cell)
      const n = naturalContentWidth(cell)
      if (n > natural) natural = n
      if (m.avail < avail) avail = m.avail
      box = m.box
    }
    if (!Number.isFinite(avail)) continue
    const content = Math.min(Math.ceil(natural), avail)
    column.width = content >= avail - 0.5 ? 'auto' : `${content + box}px`
  }

  // 单元素列：逐格判断是否超长。放得下 → 纯居中；放不下 → 截断省略号 + title 完整内容 + 左对齐。
  for (const column of columns) {
    if (column.type || !column.single || !column.cells.length) continue
    let avail = Number.POSITIVE_INFINITY
    let box = 0
    for (const cell of column.cells) {
      const m = measure(cell)
      if (m.avail < avail) avail = m.avail
      box = m.box
    }
    if (!Number.isFinite(avail)) continue
    for (const cell of column.cells) {
      if (naturalTextWidth(cell) > avail + 1) {
        cell.dataset.ymAlign = 'trunc'
        cell.style.setProperty(WIDTH_VAR, `${Math.floor(avail) + box}px`)
        const full = (cell.textContent || '').trim()
        if (full) {
          cell.setAttribute('title', full)
          cell.dataset.ymTitle = '1'
        }
      } else {
        cell.dataset.ymAlign = 'center'
        cell.style.setProperty(WIDTH_VAR, 'auto')
        if (cell.dataset.ymTitle === '1') {
          cell.removeAttribute('title')
          delete cell.dataset.ymTitle
        }
      }
    }
  }

  for (const column of columns) {
    if (column.type || column.single) continue
    const width = column.width ?? 'auto'
    for (const cell of column.cells) {
      if (cell.style.getPropertyValue(WIDTH_VAR) !== width) cell.style.setProperty(WIDTH_VAR, width)
      if (cell.dataset.ymAlign !== 'multi') cell.dataset.ymAlign = 'multi'
      // box=容器收缩到内容自然宽（内容可再居中）；full=自然宽>=列宽的回退满宽（内容保持左对齐截断）
      const fit = width === 'auto' ? 'full' : 'box'
      if (cell.dataset.ymFit !== fit) cell.dataset.ymFit = fit
      if (cell.dataset.ymTitle === '1') {
        cell.removeAttribute('title')
        delete cell.dataset.ymTitle
      }
    }
  }
}

/**
 * 过渡/动画未走完时 computed style 仍是起始值（例如 font-weight 700→400），
 * 此刻量到的文字宽度偏大，会把容器定宽成错误的值，必须等动画结束再量。
 * 但只改 opacity/颜色的动画（loading 遮罩淡入）不影响文字尺寸，
 * 等它会让遮罩下的行一直停在未归一化的满宽状态。
 */
const NON_GEOMETRIC_PROPS = new Set([
  'opacity', 'color', 'backgroundColor',
  'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
  'boxShadow', 'outlineColor', 'fill', 'stroke', 'filter', 'backdropFilter',
])
const KEYFRAME_META = new Set(['offset', 'computedOffset', 'easing', 'composite'])

function changesGeometry(anim: Animation): boolean {
  const effect = anim.effect
  if (!(effect instanceof KeyframeEffect) || typeof effect.getKeyframes !== 'function') return true
  for (const frame of effect.getKeyframes()) {
    for (const prop of Object.keys(frame)) {
      if (KEYFRAME_META.has(prop)) continue
      if (!NON_GEOMETRIC_PROPS.has(prop)) return true
    }
  }
  return false
}

function pendingAnimations(scope: Element): Animation[] {
  if (typeof document.getAnimations !== 'function') return []
  const out: Animation[] = []
  for (const anim of document.getAnimations()) {
    const effect = anim.effect
    const target = effect instanceof KeyframeEffect ? effect.target : null
    if (!(target instanceof Element)) continue
    if (!scope.contains(target) && !target.contains(scope)) continue
    if (anim.playState !== 'running') continue
    const timing = effect?.getComputedTiming?.()
    if (timing && !Number.isFinite(timing.endTime)) continue
    if (!changesGeometry(anim)) continue
    out.push(anim)
  }
  return out
}

function signature({ scope, tbody }: Target): string {
  const first = tbody.children[0] as HTMLElement | undefined
  const cols = first ? Array.from(first.children).map((td) => td.getBoundingClientRect().width.toFixed(1)) : []
  const text = Array.from(tbody.children)
    .map((row) => (row as HTMLElement).textContent || '')
    .join('\u0001')
  return `${scope.getBoundingClientRect().width.toFixed(1)}|${cols.join(',')}|${text}`
}

function watch(el: Element): void {
  if (watched.has(el) || !resizeObserver) return
  watched.add(el)
  resizeObserver.observe(el)
}

function run(): void {
  applying = true
  let waiting: Animation[] = []
  try {
    for (const target of collect()) {
      watch(target.scope)
      watch(target.tbody)
      const anims = pendingAnimations(target.scope)
      if (anims.length && (!waitStart || performance.now() - waitStart < WAIT_LIMIT)) {
        if (!waitStart) waitStart = performance.now()
        waiting = waiting.concat(anims)
        continue
      }
      const sig = signature(target)
      if (signatures.get(target.tbody) === sig) continue
      normalize(target)
      signatures.set(target.tbody, sig)
    }
  } finally {
    const pending = observer?.takeRecords() ?? []
    applying = false
    if (pending.length) schedule()
  }
  if (waiting.length) {
    Promise.all(waiting.map((anim) => anim.finished)).then(schedule, schedule)
    if (!retryTimer) {
      retryTimer = window.setTimeout(() => {
        retryTimer = 0
        schedule()
      }, 120)
    }
  } else {
    waitStart = 0
  }
}

function schedule(): void {
  if (applying || frame) return
  frame = requestAnimationFrame(() => {
    frame = 0
    run()
  })
}

export function installTableAlign(): void {
  if (observer) return

  observer = new MutationObserver(schedule)
  observer.observe(document.body, { childList: true, subtree: true, characterData: true })

  resizeObserver = new ResizeObserver(schedule)
  window.addEventListener('resize', schedule)
  document.fonts?.ready.then(schedule).catch(() => undefined)

  schedule()
}

export function uninstallTableAlign(): void {
  observer?.disconnect()
  observer = null
  resizeObserver?.disconnect()
  resizeObserver = null
  window.removeEventListener('resize', schedule)
  if (frame) cancelAnimationFrame(frame)
  frame = 0
  if (retryTimer) window.clearTimeout(retryTimer)
  retryTimer = 0
  waitStart = 0
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => uninstallTableAlign())
}