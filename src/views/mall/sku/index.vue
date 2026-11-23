<template>
  <div class="mall-page merchant-sku-page">
    <div v-if="spuContext" class="mp-context-bar">
      <span class="shelf-mark"></span>
      <b>{{ spuContext.name }}</b>
      <small>正在管理该商品的 SKU · 共 {{ spuContext.count }} 个</small>
      <el-button @click="clearSpuFilter">查看全部 SKU</el-button>
    </div>

    <section class="mall-filter-panel">
      <el-form :inline="true" :model="queryParams" class="mall-query-form" @submit.prevent="handleQuery">
        <el-form-item label="名称">
          <el-input v-model="queryParams.name" clearable placeholder="SKU 名称或商品名称" @clear="handleQuery" />
        </el-form-item>
        <el-form-item label="规格编码">
          <el-input v-model="queryParams.specCode" clearable placeholder="请输入规格编码" @clear="handleQuery" />
        </el-form-item>
        <el-form-item label="库存上限">
          <el-input-number
            v-model="queryParams.stockMax"
            :min="0"
            :precision="0"
            :controls="false"
            placeholder="不限制"
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item class="mall-query-actions">
          <el-button @click="resetQuery">重置</el-button>
          <el-button type="primary" native-type="submit" icon="Search">查询</el-button>
        </el-form-item>
      </el-form>
      <div v-if="queryParams.spuId" class="mall-business-actions">
        <el-button type="primary" icon="Plus" @click="handleAdd">新增 SKU</el-button>
      </div>
    </section>

    <section class="mall-table-panel">
      <el-table data-ym-table="r55"
        v-loading="loading"
        :data="tableData"
        row-key="id"
        @selection-change="selectedRows = $event"
      >
        <el-table-column type="selection" width="48" align="center" />
        <el-table-column prop="id" label="ID" min-width="170" align="center" />
        <el-table-column label="所属商品" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <CopyableText :value="spuNameOf(row)" label="所属商品" />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" min-width="180" show-overflow-tooltip />
        <el-table-column label="规格编码" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <CopyableText :value="row.specCode" label="规格编码" />
          </template>
        </el-table-column>
        <el-table-column label="销售价格" min-width="120" align="center">
          <template #default="{ row }">
            <span class="numeric amount-strong">¥{{ Number(row.price || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库存数量" min-width="130" align="center">
          <template #default="{ row }">
            <span :class="stockClass(row.stock)">
              {{ row.stock }}
              <em v-if="Number(row.stock) === 0" class="mp-stock-flag">售罄</em>
              <em v-else-if="Number(row.stock) <= 10" class="mp-stock-flag low">偏低</em>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <div class="table-row-actions">
              <el-button link type="primary" @click="handleUpdate(row)">修改</el-button>
              <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <div class="mp-empty">
            <el-icon><Filter /></el-icon>
            <b>没有匹配的 SKU</b>
            <span>{{ queryParams.spuId ? '该商品暂无 SKU，点击「新增 SKU」配置规格组合' : '调整筛选条件后重试' }}</span>
          </div>
        </template>
      </el-table>

      <MallPagination
        :total="total"
        :page="queryParams.current"
        :limit="queryParams.size"
        @pagination="handlePageChange"
      />
    </section>

    <el-dialog
      v-model="dialogVisible"
      width="600px"
      class="mp-sku-dialog"
      :close-on-click-modal="!submitting"
      :close-on-press-escape="!submitting"
      :show-close="!submitting"
      @closed="resetForm"
    >
      <template #header>
        <div class="mp-dialog-head">
          <span class="drawer-kicker">SKU</span>
          <h2>{{ skuForm.skuId ? '编辑SKU' : '新增SKU' }}</h2>
        </div>
      </template>
      <el-form ref="formRef" :model="skuForm" :rules="formRules" label-position="top" class="mp-form-grid">
        <el-form-item label="名称" prop="name" class="is-wide">
          <el-input v-model="skuForm.name" maxlength="64" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="规格" prop="optIds" class="is-wide">
          <div v-if="loadingSpec" class="mp-sku-spec-empty">规格加载中…</div>
          <div v-else-if="specOptions.length === 0" class="mp-sku-spec-empty">
            该商品暂无规格，请先在 SPU 编辑中设置规格。
          </div>
          <div v-else class="mp-sku-specs">
            <label v-for="(spec, index) in specOptions" :key="spec.specId" class="mp-sku-spec">
              <span>{{ spec.specName }}</span>
              <el-select v-model="skuForm.optIds[index]" :placeholder="`请选择${spec.specName}`">
                <el-option v-for="opt in spec.opts" :key="opt.optId" :label="opt.optName" :value="opt.optId" />
              </el-select>
            </label>
          </div>
        </el-form-item>
        <el-form-item label="销售价格" prop="price">
          <el-input-number
            v-model="skuForm.price"
            :min="0"
            :precision="2"
            :step="0.01"
            :controls="false"
            placeholder="请输入销售价格"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="库存数量" prop="stock">
          <el-input-number
            v-model="skuForm.stock"
            :min="0"
            :precision="0"
            :step="1"
            :controls="false"
            placeholder="请输入库存数量"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="submitting" @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Filter } from '@element-plus/icons-vue'
import CopyableText from '@/components/mall/CopyableText.vue'
import MallPagination from '@/components/mall/MallPagination.vue'
import { getCurrentShop } from '@/utils/shop'
import { getRequestErrorMessage, isUserCancel } from '@/utils/error'
import { deleteSku, getSkuDetail, getSkuList, saveSku, updateSku } from '@/api/mall/sku'
import { listSpu, querySpec } from '@/api/mall/spu'

defineOptions({ name: 'ProductSkuPage' })

const route = useRoute()
const router = useRouter()
const tableData = ref([])
const loading = ref(false)
const submitting = ref(false)
const total = ref(0)
const selectedRows = ref([])
const queryParams = ref({ current: 1, size: 10, name: '', specCode: '', spuId: '', stockMax: null })
const dialogVisible = ref(false)
const formRef = ref(null)
const skuForm = ref(createEmptyForm())
const specOptions = ref([])
const loadingSpec = ref(false)
const spuNameMap = ref({})
const spuContext = ref(null)

const formRules = {
  price: [{ required: true, message: '请输入销售价格', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存数量', trigger: 'blur' }],
  optIds: [
    {
      trigger: 'change',
      validator: (rule, value, callback) => {
        if (!specOptions.value.length) return callback()
        const complete =
          Array.isArray(value) &&
          value.length === specOptions.value.length &&
          value.every((id) => id !== undefined && id !== null && id !== '')
        callback(complete ? undefined : new Error('请选择所有规格选项'))
      },
    },
  ],
}

function createEmptyForm() {
  return { skuId: '', spuId: '', name: '', price: null, stock: null, optIds: [] }
}

function getShopId() {
  return getCurrentShop()?.id || ''
}

function stockClass(stock) {
  const value = Number(stock)
  if (value === 0) return 'numeric mp-stock-out'
  if (value <= 10) return 'numeric mp-stock-low'
  return 'numeric'
}

function spuNameOf(row) {
  return row.spuName || spuNameMap.value[String(row.spuId)] || ''
}

async function loadSpuNames() {
  try {
    const res = await listSpu({ current: 1, size: 500, shopId: getShopId() })
    const map = {}
    for (const row of res.data?.records || []) map[String(row.id)] = row.name
    spuNameMap.value = map
  } catch {
    spuNameMap.value = {}
  }
}

async function refreshSpuContext() {
  const spuId = queryParams.value.spuId
  if (!spuId) {
    spuContext.value = null
    return
  }
  const name = spuNameMap.value[String(spuId)] || ''
  try {
    const res = await getSkuList({ current: 1, size: 1, spuId, shopId: getShopId() })
    spuContext.value = { id: spuId, name, count: Number(res.data?.total || 0) }
  } catch {
    spuContext.value = { id: spuId, name, count: 0 }
  }
}

function clearSpuFilter() {
  router.push({ path: '/mall/sku' })
}

function syncRouteFilter() {
  const spuId = typeof route.query.spuId === 'string' ? route.query.spuId : ''
  const stockMax = Number(route.query.stockMax)
  queryParams.value.spuId = spuId
  queryParams.value.stockMax = Number.isInteger(stockMax) && stockMax >= 0 ? stockMax : null
}

async function getList() {
  loading.value = true
  try {
    const res = await getSkuList({ ...queryParams.value, shopId: getShopId() })
    tableData.value = res.data?.records || []
    total.value = Number(res.data?.total || 0)
    selectedRows.value = []
  } catch (error) {
    const message = getRequestErrorMessage(error)
    if (message) ElMessage.error(message)
  } finally {
    loading.value = false
  }
}

function handleQuery() {
  queryParams.value.current = 1
  void getList()
}

function handlePageChange(value) {
  queryParams.value.current = value.page
  queryParams.value.size = value.limit
  void getList()
}

function resetQuery() {
  queryParams.value.name = ''
  queryParams.value.specCode = ''
  queryParams.value.stockMax = null
  queryParams.value.current = 1
  if (route.query.stockMax !== undefined) {
    const { stockMax, ...rest } = route.query
    void router.replace({ path: route.path, query: rest })
    return
  }
  void getList()
}

watch(
  () => [route.query.spuId, route.query.stockMax],
  () => {
    syncRouteFilter()
    queryParams.value.current = 1
    void getList()
    void refreshSpuContext()
  },
)

async function loadSpecOptions(spuId, pickedOptIds) {
  loadingSpec.value = true
  specOptions.value = []
  try {
    const res = await querySpec({ shopId: getShopId(), spuId })
    specOptions.value = res.data || []
    skuForm.value.optIds = specOptions.value.map((spec) => {
      const hit = (pickedOptIds || []).find((id) => (spec.opts || []).some((opt) => String(opt.optId) === String(id)))
      return hit ?? spec.opts?.[0]?.optId ?? ''
    })
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '获取规格失败，请重试')
  } finally {
    loadingSpec.value = false
  }
}

function handleAdd() {
  skuForm.value = { ...createEmptyForm(), spuId: queryParams.value.spuId }
  dialogVisible.value = true
  void loadSpecOptions(queryParams.value.spuId, [])
}

async function handleUpdate(row) {
  let detail = row
  try {
    const res = await getSkuDetail(row.id)
    detail = res.data || row
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '获取SKU详情失败，请重试')
    return
  }
  skuForm.value = {
    skuId: row.id,
    spuId: detail.spuId ?? row.spuId,
    name: detail.name ?? '',
    price: detail.price ?? null,
    stock: detail.stock ?? null,
    optIds: [],
  }
  dialogVisible.value = true
  const picked = (detail.specs || []).map((spec) => spec.optId)
  const fallback = String(detail.optIds || '').split(',').filter(Boolean).map(Number)
  await loadSpecOptions(skuForm.value.spuId, picked.length ? picked : fallback)
}

function resetForm() {
  skuForm.value = createEmptyForm()
  specOptions.value = []
  formRef.value?.clearValidate()
}

async function handleSubmit() {
  if (!formRef.value || submitting.value) return
  submitting.value = true
  try {
    await formRef.value.validate()
    const payload = {
      shopId: getShopId(),
      spuId: skuForm.value.spuId,
      name: skuForm.value.name.trim(),
      price: skuForm.value.price,
      stock: skuForm.value.stock,
      optIds: skuForm.value.optIds,
    }
    if (skuForm.value.skuId) await updateSku({ ...payload, skuId: skuForm.value.skuId })
    else await saveSku(payload)
    ElMessage.success(skuForm.value.skuId ? 'SKU 已保存' : 'SKU 已新增')
    dialogVisible.value = false
    await getList()
    await refreshSpuContext()
  } catch (error) {
    const message = getRequestErrorMessage(error)
    if (message) ElMessage.error(message)
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除 SKU“${row.name}”吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger',
    })
    await deleteSku([row.id])
    ElMessage.success('SKU 已删除')
    await getList()
    await refreshSpuContext()
  } catch (error) {
    if (!isUserCancel(error)) ElMessage.error(getRequestErrorMessage(error) || '删除失败')
  }
}

onMounted(async () => {
  syncRouteFilter()
  void getList()
  await loadSpuNames()
  await refreshSpuContext()
})
</script>