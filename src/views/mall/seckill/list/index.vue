<template>
  <div class="mall-page seckill-activity-page">
    <div class="sk-status-tabs">
      <button
        type="button"
        data-status="all"
        class="sk-tab"
        :class="{ active: activeTab === 'all' }"
        @click="switchTab('all')"
      >
        全部<span class="sk-tab-count">{{ stats.total }}</span>
      </button>
      <button
        v-for="status in STATUS_ORDER"
        :key="status"
        type="button"
        :data-status="status"
        class="sk-tab"
        :class="{ active: activeTab === status }"
        @click="switchTab(status)"
      >
        {{ statusMeta(status).label }}<span class="sk-tab-count">{{ tabCount(status) }}</span>
      </button>
    </div>

    <section class="mall-filter-panel">
      <el-form :inline="true" class="mall-query-form" @submit.prevent="search">
        <el-form-item label="活动名称">
          <el-input
            v-model="filters.keyword"
            clearable
            placeholder="搜索活动名称或描述"
            @keyup.enter="search"
          />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-select v-model="filters.enabled" placeholder="全部状态">
            <el-option label="全部状态" value="" />
            <el-option label="启用" :value="true" />
            <el-option label="停用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item class="mall-query-actions">
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="primary" native-type="submit"><el-icon><Search /></el-icon>查询</el-button>
        </el-form-item>
      </el-form>
      <div class="mall-business-actions">
        <el-button type="primary" @click="openCreate"><el-icon><Plus /></el-icon>新建活动</el-button>
      </div>
    </section>

    <section class="mall-table-panel sk-table-panel">
      <div class="sk-table-intro">
        <span><el-icon><Clock /></el-icon>发布前需配置至少 1 个场次；报名截止时间需早于活动开始时间。</span>
        <div class="sk-intro-right">
          <span v-if="stats.pendingSetup > 0" class="sk-setup-chip">
            <el-icon><Warning /></el-icon>{{ stats.pendingSetup }} 个待配置场次
          </span>
          <b>共 {{ page.total }} 个活动</b>
        </div>
      </div>

      <el-table data-ym-table="r48"
        v-loading="loading"
        :data="records"
        row-key="id"
        class="sk-activity-table"
      >
        <el-table-column label="活动信息" min-width="300">
          <template #default="{ row }">
            <div class="sk-activity-cell">
              <span class="sk-cover-art">
                <StorageImage
                  v-if="row.coverImage"
                  :src="row.coverImage"
                  :preview="false"
                  :width="88"
                  :height="44"
                />
                <span v-else class="sk-cover-fallback"><el-icon><Picture /></el-icon></span>
              </span>
              <span class="sk-activity-copy">
                <button type="button" class="sk-name-link" :title="row.name" @click="openDetail(row)">
                  {{ row.name || '未命名活动' }}
                </button>
                <small :title="row.description">{{ row.description || '暂无活动描述' }}</small>
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="报名时间" min-width="160">
          <template #default="{ row }">
            <div
              class="sk-when-cell"
              :title="`${displayTime(row.applyBeginTime)} 至 ${displayTime(row.applyEndTime)}`"
            >
              <template v-if="row.applyBeginTime && row.applyEndTime">
                <span>{{ shortTime(row.applyBeginTime) }}</span>
                <i>→</i>
                <span>{{ shortTime(row.applyEndTime) }}</span>
              </template>
              <span v-else class="sk-when-empty">待设置</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="活动时间" min-width="160">
          <template #default="{ row }">
            <div
              class="sk-when-cell"
              :title="`${displayTime(row.activityBeginTime)} 至 ${displayTime(row.activityEndTime)}`"
            >
              <template v-if="row.activityBeginTime && row.activityEndTime">
                <span>{{ shortTime(row.activityBeginTime) }}</span>
                <i>→</i>
                <span>{{ shortTime(row.activityEndTime) }}</span>
              </template>
              <span v-else class="sk-when-empty">待设置</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="场次" min-width="84">
          <template #default="{ row }">
            <button
              type="button"
              class="sk-session-link"
              :class="{ 'is-empty': !row.sessionCount }"
              @click="goSessions(row)"
            >
              {{ row.sessionCount ? `${row.sessionCount} 场` : '未配置' }}
            </button>
          </template>
        </el-table-column>

        <el-table-column label="状态" min-width="96">
          <template #default="{ row }">
            <span class="sk-ticket" :class="`tone-${statusMeta(row.status).tone}`">
              {{ statusMeta(row.status).label }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="sort" label="排序" min-width="56" />

        <el-table-column label="启用" min-width="84">
          <template #default="{ row }">
            <div class="sk-switch">
              <el-switch
                v-model="row.isEnabled"
                :loading="toggleLoadingId === row.id"
                :disabled="toggleLoadingId === row.id"
                @change="toggleEnabled(row)"
              />
              <span :class="{ 'is-on': row.isEnabled }">{{ row.isEnabled ? '启用' : '停用' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right" class-name="mall-actions-column">
          <template #default="{ row }">
            <div class="sk-row-actions">
              <el-button
                v-if="statusMeta(row.status).action"
                link
                type="primary"
                class="sk-next-link"
                @click="openTransition(row)"
              >
                {{ statusMeta(row.status).action }}
              </el-button>
              <el-button v-else link type="primary" @click="openDetail(row)">详情</el-button>
              <el-button link type="primary" @click="openEditor(row)">编辑</el-button>
              <el-dropdown
                trigger="click"
                popper-class="sk-row-menu"
                @command="handleRowCommand($event, row)"
              >
                <el-button link class="sk-more-btn">
                  更多<el-icon class="sk-more-icon"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="detail">查看详情</el-dropdown-item>
                    <el-dropdown-item command="sessions">场次管理</el-dropdown-item>
                    <el-dropdown-item command="audit">报名审核</el-dropdown-item>
                    <el-dropdown-item
                      command="delete"
                      divided
                      :disabled="row.status !== '1'"
                      :title="row.status !== '1' ? '仅新建状态的活动可删除' : ''"
                      class="sk-danger-action"
                    >
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>

        <template #empty>
          <div class="sk-empty">
            <el-icon><Calendar /></el-icon>
            <b>没有匹配的秒杀活动</b>
            <span>调整筛选条件，或新建一个活动</span>
          </div>
        </template>
      </el-table>

      <MallPagination
        v-if="page.total > 0"
        :total="page.total"
        :page="page.current"
        :limit="page.size"
        :page-sizes="[10, 20, 50]"
        :background="true"
        layout="sizes, prev, pager, next"
        @pagination="handlePageChange"
      />
    </section>

    <el-drawer v-model="detailVisible" size="560px" :with-header="false" :show-close="false">
      <div v-if="detailRow" class="sk-detail">
        <div class="sk-dialog-head">
          <div>
            <span class="sk-kicker">SECKILL ACTIVITY</span>
            <h2>活动详情</h2>
          </div>
          <button type="button" class="sk-close-btn" @click="detailVisible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>

        <div class="sk-detail-hero">
          <span class="sk-detail-cover">
            <el-image
              v-if="detailRow.coverImage"
              :src="getStoragePreviewUrl(detailRow.coverImage)"
              fit="cover"
              style="width: 100%; height: 100%"
            />
            <span v-else class="sk-cover-fallback"><el-icon><Picture /></el-icon></span>
          </span>
          <span class="sk-detail-copy">
            <h3>{{ detailRow.name }}</h3>
            <span class="sk-ticket" :class="`tone-${statusMeta(detailRow.status).tone}`">
              {{ statusMeta(detailRow.status).label }}
            </span>
            <p>{{ detailRow.description || '暂无活动描述' }}</p>
          </span>
        </div>

        <div class="sk-detail-times">
          <div>
            <span>报名时间</span>
            <b>{{ fullRange(detailRow.applyBeginTime, detailRow.applyEndTime) }}</b>
          </div>
          <div>
            <span>活动时间</span>
            <b>{{ fullRange(detailRow.activityBeginTime, detailRow.activityEndTime) }}</b>
          </div>
        </div>

        <div class="sk-detail-meta">
          <div>
            <span>活动场次</span>
            <b>{{ detailRow.sessionCount ? `${detailRow.sessionCount} 个` : '未配置' }}</b>
          </div>
          <div>
            <span>排序</span>
            <b>{{ detailRow.sort }}</b>
          </div>
          <div>
            <span>启用状态</span>
            <b>{{ detailRow.isEnabled ? '启用' : '停用' }}</b>
          </div>
          <div>
            <span>最近更新</span>
            <b>{{ displayTime(detailRow.updateTime) || '—' }}</b>
          </div>
        </div>

        <div class="sk-drawer-section">
          <h3>活动进度</h3>
          <div class="sk-flow">
            <span
              v-for="(step, index) in FLOW"
              :key="step.value"
              class="sk-flow-step"
              :class="{ 'is-done': index <= currentFlowIndex, 'is-current': index === currentFlowIndex }"
            >
              <i></i><small>{{ step.label }}</small>
            </span>
          </div>
        </div>

        <div class="sk-drawer-section">
          <h3>备注</h3>
          <p class="sk-detail-remark">{{ detailRow.remark || '暂无备注' }}</p>
        </div>

        <div class="sk-drawer-actions">
          <el-button @click="detailVisible = false">关闭</el-button>
          <el-button @click="goSessions(detailRow)">场次管理</el-button>
          <el-button type="primary" @click="openEditor(detailRow)">编辑活动</el-button>
        </div>
      </div>
    </el-drawer>

    <el-dialog
      v-model="editorVisible"
      width="780px"
      class="sk-custom-dialog sk-editor-dialog"
      :with-header="false"
      :show-close="false"
      :close-on-click-modal="false"
      @closed="handleEditorClosed"
    >
      <div class="sk-editor">
        <div class="sk-dialog-head">
          <div>
            <span class="sk-kicker">SECKILL ACTIVITY</span>
            <h2>{{ editorId ? '编辑活动' : '新建活动' }}</h2>
          </div>
          <button type="button" class="sk-close-btn" @click="editorVisible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>

        <div class="sk-dialog-note">
          <el-icon><Lightning /></el-icon>
          <span>发布前需配置活动场次，并确保报名截止时间早于活动开始时间；保存后可在列表按阶段推进活动状态。</span>
        </div>

        <div class="sk-form-grid">
          <label class="sk-field" :class="{ 'is-invalid': editorErrors.name }">
            <span>活动名称 <em class="sk-required">*</em></span>
            <el-input
              v-model="editorForm.name"
              maxlength="64"
              placeholder="例如：秋日数码秒杀"
              @input="clearEditorError('name')"
            />
            <small v-if="editorErrors.name" class="sk-field-error">{{ editorErrors.name }}</small>
          </label>

          <label class="sk-field" :class="{ 'is-invalid': editorErrors.sort }">
            <span>排序 <em class="sk-required">*</em></span>
            <el-input-number
              v-model="editorForm.sort"
              :min="1"
              :precision="0"
              :controls="false"
              style="width: 100%"
              @change="clearEditorError('sort')"
            />
            <small v-if="editorErrors.sort" class="sk-field-error">{{ editorErrors.sort }}</small>
          </label>

          <label class="sk-field wide" :class="{ 'is-invalid': editorErrors.description }">
            <span>活动描述 <em class="sk-required">*</em></span>
            <el-input
              v-model="editorForm.description"
              type="textarea"
              :rows="3"
              maxlength="500"
              resize="none"
              placeholder="简要说明活动商品与玩法"
              @input="clearEditorError('description')"
            />
            <small v-if="editorErrors.description" class="sk-field-error">{{ editorErrors.description }}</small>
          </label>

          <div class="sk-field wide" :class="{ 'is-invalid': editorErrors.cover }">
            <span>活动封面 <em class="sk-required">*</em></span>
            <div class="sk-cover-editor">
              <span class="sk-cover-preview">
                <el-image
                  v-if="coverPreviewUrl"
                  :src="coverPreviewUrl"
                  fit="cover"
                  style="width: 100%; height: 100%"
                />
                <span v-else class="sk-cover-fallback"><el-icon><Picture /></el-icon></span>
              </span>
              <span class="sk-cover-copy">
                <el-upload
                  :show-file-list="false"
                  :http-request="uploadCover"
                  :before-upload="beforeCoverUpload"
                  accept=".jpg,.jpeg,.png,.webp"
                  :disabled="coverUploading"
                >
                  <el-button class="sk-upload-btn" :loading="coverUploading">
                    <el-icon v-if="!coverUploading"><Upload /></el-icon>
                    {{ editorForm.coverImage ? '更换封面' : '选择封面' }}
                  </el-button>
                </el-upload>
                <small>
                  {{
                    editorForm.coverImage
                      ? '保存后用于活动列表与 App 展示；建议 640×320（2:1），单张不超过 2MB。'
                      : '建议 640×320（2:1），支持 JPG / PNG / WebP，单张不超过 2MB。'
                  }}
                </small>
              </span>
            </div>
            <small v-if="editorErrors.cover" class="sk-field-error">{{ editorErrors.cover }}</small>
          </div>

          <div class="sk-field wide" :class="{ 'is-invalid': editorErrors.applyTime }">
            <span>报名时间 <em class="sk-required">*</em></span>
            <div class="sk-time-inputs">
              <label>
                <small>开始</small>
                <el-date-picker
                  v-model="editorForm.applyBeginTime"
                  type="datetime"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  format="YYYY-MM-DD HH:mm"
                  placeholder="选择开始时间"
                  style="width: 100%"
                  @change="handleTimeChange"
                />
              </label>
              <i>→</i>
              <label>
                <small>结束</small>
                <el-date-picker
                  v-model="editorForm.applyEndTime"
                  type="datetime"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  format="YYYY-MM-DD HH:mm"
                  placeholder="选择结束时间"
                  style="width: 100%"
                  @change="handleTimeChange"
                />
              </label>
            </div>
            <small v-if="editorErrors.applyTime" class="sk-field-error">{{ editorErrors.applyTime }}</small>
          </div>

          <div class="sk-field wide" :class="{ 'is-invalid': editorErrors.activityTime }">
            <span>活动时间 <em class="sk-required">*</em></span>
            <div class="sk-time-inputs">
              <label>
                <small>开始</small>
                <el-date-picker
                  v-model="editorForm.activityBeginTime"
                  type="datetime"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  format="YYYY-MM-DD HH:mm"
                  placeholder="选择开始时间"
                  style="width: 100%"
                  @change="handleTimeChange"
                />
              </label>
              <i>→</i>
              <label>
                <small>结束</small>
                <el-date-picker
                  v-model="editorForm.activityEndTime"
                  type="datetime"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  format="YYYY-MM-DD HH:mm"
                  placeholder="选择结束时间"
                  style="width: 100%"
                  @change="handleTimeChange"
                />
              </label>
            </div>
            <small v-if="editorErrors.activityTime" class="sk-field-error">{{ editorErrors.activityTime }}</small>
          </div>

          <label class="sk-field wide">
            <span>备注 <small>选填</small></span>
            <el-input
              v-model="editorForm.remark"
              type="textarea"
              :rows="2"
              maxlength="255"
              resize="none"
              placeholder="补充运营说明或发布注意事项"
            />
          </label>
        </div>

        <p v-if="editorErrors.sequence" class="sk-sequence-error">
          <el-icon><Warning /></el-icon>{{ editorErrors.sequence }}
        </p>

        <div class="sk-dialog-actions">
          <el-button @click="editorVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="editorSaving"
            :disabled="coverUploading"
            @click="saveEditor"
          >
            {{ editorId ? '保存修改' : '创建活动' }}
          </el-button>
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="transition.visible"
      width="580px"
      class="sk-custom-dialog"
      :with-header="false"
      :show-close="false"
    >
      <div v-if="transition.row && transition.meta" class="sk-transition">
        <div class="sk-dialog-head">
          <div>
            <span class="sk-kicker">SECKILL WORKFLOW</span>
            <h2>{{ transition.meta.action }}活动</h2>
          </div>
          <button type="button" class="sk-close-btn" @click="transition.visible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>

        <div class="sk-transition-context">
          <span class="sk-cover-art small">
            <StorageImage
              v-if="transition.row.coverImage"
              :src="transition.row.coverImage"
              :preview="false"
              :width="72"
              :height="36"
            />
            <span v-else class="sk-cover-fallback"><el-icon><Picture /></el-icon></span>
          </span>
          <span class="sk-transition-copy">
            <b>{{ transition.row.name }}</b>
            <small>
              报名 {{ shortTime(transition.row.applyBeginTime) }} → {{ shortTime(transition.row.applyEndTime) }}
            </small>
            <small>
              活动 {{ shortTime(transition.row.activityBeginTime) }} → {{ shortTime(transition.row.activityEndTime) }}
            </small>
          </span>
          <span class="sk-transition-shift">
            <span class="sk-ticket" :class="`tone-${transition.meta.tone}`">
              {{ transition.meta.label }}
            </span>
            <el-icon><ArrowRight /></el-icon>
            <span
              v-if="transitionNextMeta"
              class="sk-ticket"
              :class="`tone-${transitionNextMeta.tone}`"
            >
              {{ transitionNextMeta.label }}
            </span>
          </span>
        </div>

        <div
          v-if="isPublishTransition"
          class="sk-check"
          :class="transitionChecks.fail ? 'is-fail' : 'is-pass'"
        >
          <b>
            <el-icon v-if="transitionChecks.fail"><Warning /></el-icon>
            <el-icon v-else><CircleCheck /></el-icon>
            {{ transitionChecks.fail ? '发布前检查未通过' : '发布前检查通过' }}
          </b>
          <ul class="sk-check-list">
            <li :class="{ 'is-bad': !transitionChecks.timeConfigured }">
              <i></i>报名与活动时间段已配置
            </li>
            <li :class="{ 'is-bad': !transitionChecks.orderOk }">
              <i></i>报名截止时间早于活动开始时间
            </li>
            <li :class="{ 'is-bad': !transitionChecks.sessionOk }">
              <i></i>已配置活动场次{{ transition.row.sessionCount ? `（${transition.row.sessionCount} 个）` : '' }}
            </li>
          </ul>
        </div>

        <p class="sk-transition-hint">{{ transition.meta.hint }}</p>

        <div class="sk-dialog-actions">
          <el-button @click="transition.visible = false">取消</el-button>
          <el-button
            v-if="isPublishTransition && transitionChecks.fail"
            @click="goSessionsFromTransition"
          >
            前往场次管理
          </el-button>
          <el-button
            type="primary"
            :disabled="isPublishTransition && transitionChecks.fail"
            :loading="transitionSaving"
            @click="confirmTransition"
          >
            确认{{ transition.meta.action }}
          </el-button>
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="deleteVisible"
      width="460px"
      class="sk-custom-dialog"
      :with-header="false"
      :show-close="false"
      @closed="deletingRow = null"
    >
      <div v-if="deletingRow" class="sk-delete">
        <div class="sk-dialog-head">
          <div>
            <span class="sk-kicker">DELETE ACTIVITY</span>
            <h2>删除活动</h2>
          </div>
          <button type="button" class="sk-close-btn" @click="deleteVisible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>

        <div class="sk-danger-confirm">
          <el-icon><Warning /></el-icon>
          <div>
            <b>删除后不可恢复</b>
            <span>仅【新建】状态的活动可以删除。删除后活动基础信息将被移除，后续需重新创建。</span>
            <small>当前活动：{{ deletingRow.name }}</small>
          </div>
        </div>

        <p class="sk-delete-context">如需保留活动记录，请改为停用或推进至活动下架。</p>

        <div class="sk-dialog-actions">
          <el-button @click="deleteVisible = false">取消</el-button>
          <el-button
            type="danger"
            class="sk-delete-confirm-btn"
            :loading="deleteSaving"
            @click="confirmDelete"
          >
            确认删除
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { UploadRequestOptions } from 'element-plus'
import {
  ArrowDown,
  ArrowRight,
  Calendar,
  CircleCheck,
  Clock,
  Close,
  Lightning,
  Picture,
  Plus,
  Search,
  Upload,
  Warning,
} from '@element-plus/icons-vue'
import {
  createSeckillActivity,
  deleteSeckillActivity,
  querySeckillActivityPage,
  querySeckillActivityStats,
  updateSeckillActivity,
  updateSeckillActivityEnabled,
  updateSeckillActivityStatus,
} from '@/api/mall/seckill'
import { uploadStorageFile } from '@/api/storage'
import { getStoragePreviewUrl } from '@/utils/storage'
import MallPagination from '@/components/mall/MallPagination.vue'
import StorageImage from '@/components/mall/StorageImage.vue'

interface SeckillActivity {
  id: string | number
  name: string
  description: string
  coverImage: string
  applyBeginTime: string | null
  applyEndTime: string | null
  activityBeginTime: string | null
  activityEndTime: string | null
  status: string
  sort: number
  isEnabled: boolean
  remark: string
  sessionCount: number
  createTime?: string | null
  updateTime?: string | null
}

interface ActivityStats {
  total: number
  created: number
  published: number
  applyStarted: number
  applyFinished: number
  activityStarted: number
  activityFinished: number
  activityDown: number
  pendingSetup: number
}

interface StatusMeta {
  label: string
  tone: 'neutral' | 'info' | 'warning' | 'success'
  action: string
  next: string
  hint: string
  countKey: keyof ActivityStats
}

const STATUS_META: Record<string, StatusMeta> = {
  '1': {
    label: '新建',
    tone: 'neutral',
    action: '发布',
    next: '2',
    hint: '发布前会校验报名与活动时间段、场次时间范围及场次重叠情况。',
    countKey: 'created',
  },
  '2': {
    label: '已发布',
    tone: 'info',
    action: '开始报名',
    next: '3',
    hint: '开始报名后，商家可在报名时间段内提交商品报名。',
    countKey: 'published',
  },
  '3': {
    label: '报名中',
    tone: 'warning',
    action: '结束报名',
    next: '4',
    hint: '结束报名后活动进入等待开始状态，请确认场次与报名商品后开始活动。',
    countKey: 'applyStarted',
  },
  '4': {
    label: '报名结束',
    tone: 'info',
    action: '开始活动',
    next: '5',
    hint: '开始活动后系统会准备秒杀库存与活动缓存，并校验审核通过的秒杀商品。',
    countKey: 'applyFinished',
  },
  '5': {
    label: '进行中',
    tone: 'success',
    action: '结束活动',
    next: '6',
    hint: '结束活动后系统会写入活动状态并清理活动缓存，活动进入结束阶段。',
    countKey: 'activityStarted',
  },
  '6': {
    label: '已结束',
    tone: 'neutral',
    action: '活动下架',
    next: '7',
    hint: '活动下架后会从进行中集合移除，App 端不再作为进行中活动展示。',
    countKey: 'activityFinished',
  },
  '7': {
    label: '已下架',
    tone: 'neutral',
    action: '',
    next: '',
    hint: '',
    countKey: 'activityDown',
  },
}

const FLOW = [
  { value: '1', label: '新建' },
  { value: '2', label: '发布' },
  { value: '3', label: '报名中' },
  { value: '4', label: '报名结束' },
  { value: '5', label: '进行中' },
  { value: '6', label: '结束' },
  { value: '7', label: '下架' },
]

const STATUS_ORDER = ['1', '2', '3', '4', '5', '6', '7']
const DEFAULT_STATUS_META: StatusMeta = STATUS_META['1']!

const router = useRouter()

const activeTab = ref('all')
const loading = ref(false)
const records = ref<SeckillActivity[]>([])
const page = reactive({ current: 1, size: 10, total: 0 })
const filters = reactive<{ keyword: string; enabled: boolean | '' }>({ keyword: '', enabled: '' })
const applied = reactive<{ keyword: string; enabled: boolean | '' }>({ keyword: '', enabled: '' })
const stats = reactive<ActivityStats>({
  total: 0,
  created: 0,
  published: 0,
  applyStarted: 0,
  applyFinished: 0,
  activityStarted: 0,
  activityFinished: 0,
  activityDown: 0,
  pendingSetup: 0,
})
const toggleLoadingId = ref<string | number | null>(null)

const detailVisible = ref(false)
const detailRow = ref<SeckillActivity | null>(null)
const currentFlowIndex = computed(() => {
  if (!detailRow.value) {
    return -1
  }
  return FLOW.findIndex((step) => step.value === detailRow.value?.status)
})

const editorVisible = ref(false)
const editorId = ref<string | number | ''>('')
const editorSaving = ref(false)
const coverUploading = ref(false)
const localCoverUrl = ref('')
const editorForm = reactive({
  name: '',
  description: '',
  coverImage: '',
  applyBeginTime: '',
  applyEndTime: '',
  activityBeginTime: '',
  activityEndTime: '',
  sort: 1 as number | null,
  remark: '',
})
const editorErrors = reactive({
  name: '',
  description: '',
  cover: '',
  sort: '',
  applyTime: '',
  activityTime: '',
  sequence: '',
})
const coverPreviewUrl = computed(() => {
  if (localCoverUrl.value) {
    return localCoverUrl.value
  }
  return editorForm.coverImage ? getStoragePreviewUrl(editorForm.coverImage) : ''
})

const transition = reactive<{
  visible: boolean
  row: SeckillActivity | null
  meta: StatusMeta | null
}>({ visible: false, row: null, meta: null })
const transitionSaving = ref(false)
const transitionNextMeta = computed(() => {
  if (!transition.meta?.next) {
    return null
  }
  return STATUS_META[transition.meta.next] ?? null
})
const isPublishTransition = computed(() => transition.meta?.next === '2')
const transitionChecks = computed(() => {
  const row = transition.row
  if (!row) {
    return { timeConfigured: false, orderOk: false, sessionOk: false, fail: true }
  }
  const applyBegin = displayTime(row.applyBeginTime)
  const applyEnd = displayTime(row.applyEndTime)
  const activityBegin = displayTime(row.activityBeginTime)
  const activityEnd = displayTime(row.activityEndTime)
  const timeConfigured = Boolean(applyBegin && applyEnd && activityBegin && activityEnd)
  const orderOk = timeConfigured
    && applyBegin < applyEnd
    && activityBegin < activityEnd
    && applyEnd <= activityBegin
  const sessionOk = Number(row.sessionCount || 0) > 0
  return {
    timeConfigured,
    orderOk,
    sessionOk,
    fail: !(timeConfigured && orderOk && sessionOk),
  }
})

const deleteVisible = ref(false)
const deleteSaving = ref(false)
const deletingRow = ref<SeckillActivity | null>(null)

function statusMeta(status?: string | number | null): StatusMeta {
  return STATUS_META[String(status ?? '1')] ?? DEFAULT_STATUS_META
}

function tabCount(status: string) {
  return stats[statusMeta(status).countKey] || 0
}

function displayTime(value?: string | null) {
  return String(value || '').replace('T', ' ').slice(0, 19)
}

function shortTime(value?: string | null) {
  const text = displayTime(value)
  return text ? `${text.slice(5, 10)} ${text.slice(11, 16)}` : '—'
}

function fullRange(start?: string | null, end?: string | null) {
  const begin = displayTime(start)
  const finish = displayTime(end)
  return begin && finish ? `${begin} 至 ${finish}` : '待设置'
}

function toEditorTime(value?: string | null) {
  return displayTime(value)
}

function buildQuery(source: { keyword: string; enabled: boolean | '' }) {
  const params: Record<string, unknown> = {}
  if (source.keyword) {
    params.keyword = source.keyword
  }
  if (source.enabled !== '') {
    params.isEnabled = source.enabled
  }
  return params
}

async function loadStats() {
  try {
    const response = (await querySeckillActivityStats(buildQuery(applied))) as {
      data?: Partial<ActivityStats>
    }
    const data = response?.data || {}
    const keys: (keyof ActivityStats)[] = [
      'total',
      'created',
      'published',
      'applyStarted',
      'applyFinished',
      'activityStarted',
      'activityFinished',
      'activityDown',
      'pendingSetup',
    ]
    keys.forEach((key) => {
      stats[key] = Number(data[key] || 0)
    })
  } catch {
    // 请求错误已由全局拦截器提示
  }
}

async function loadList() {
  loading.value = true
  try {
    const params: Record<string, unknown> = {
      current: page.current,
      size: page.size,
      ...buildQuery(applied),
    }
    if (activeTab.value !== 'all') {
      params.status = activeTab.value
    }
    const response = (await querySeckillActivityPage(params)) as {
      data?: { records?: Array<Record<string, unknown>>; total?: number | string }
    }
    const data = response?.data
    records.value = (data?.records || []).map((row) => ({
      ...row,
      id: row.id as string | number,
      name: String(row.name || ''),
      description: String(row.description || ''),
      coverImage: String(row.coverImage || ''),
      applyBeginTime: (row.applyBeginTime as string | null) || null,
      applyEndTime: (row.applyEndTime as string | null) || null,
      activityBeginTime: (row.activityBeginTime as string | null) || null,
      activityEndTime: (row.activityEndTime as string | null) || null,
      status: String(row.status ?? '1'),
      sort: Number(row.sort || 0),
      isEnabled: Boolean(row.isEnabled),
      remark: String(row.remark || ''),
      sessionCount: Number(row.sessionCount || 0),
    })) as SeckillActivity[]
    page.total = Number(data?.total || 0)
    if (!records.value.length && page.current > 1 && page.total > 0) {
      page.current = Math.max(1, Math.ceil(page.total / page.size))
      await loadList()
    }
  } catch {
    // 请求错误已由全局拦截器提示
  } finally {
    loading.value = false
  }
}

async function refreshAll() {
  await Promise.all([loadList(), loadStats()])
}

function switchTab(status: string) {
  if (activeTab.value === status) {
    return
  }
  activeTab.value = status
  page.current = 1
  void loadList()
}

function search() {
  applied.keyword = filters.keyword.trim()
  applied.enabled = filters.enabled
  page.current = 1
  void Promise.all([loadList(), loadStats()])
}

function resetFilters() {
  filters.keyword = ''
  filters.enabled = ''
  applied.keyword = ''
  applied.enabled = ''
  activeTab.value = 'all'
  page.current = 1
  void refreshAll()
}

function handlePageChange({ page: nextPage, limit }: { page: number; limit: number }) {
  page.current = nextPage
  page.size = limit
  void loadList()
}

function openDetail(row: SeckillActivity) {
  detailRow.value = row
  detailVisible.value = true
}

function goSessions(row: SeckillActivity) {
  detailVisible.value = false
  router.push({
    path: '/mall/seckill/session',
    query: { activityId: String(row.id), activityName: row.name },
  })
}

function goAudit(row: SeckillActivity) {
  detailVisible.value = false
  router.push({
    path: '/mall/seckill/audit',
    query: { activityId: String(row.id) },
  })
}

function handleRowCommand(command: string, row: SeckillActivity) {
  if (command === 'detail') {
    openDetail(row)
  } else if (command === 'sessions') {
    goSessions(row)
  } else if (command === 'audit') {
    goAudit(row)
  } else if (command === 'delete' && row.status === '1') {
    deletingRow.value = row
    deleteVisible.value = true
  }
}

function clearEditorErrors() {
  editorErrors.name = ''
  editorErrors.description = ''
  editorErrors.cover = ''
  editorErrors.sort = ''
  editorErrors.applyTime = ''
  editorErrors.activityTime = ''
  editorErrors.sequence = ''
}

function clearEditorError(key: keyof typeof editorErrors) {
  editorErrors[key] = ''
}

function resetEditorForm() {
  editorForm.name = ''
  editorForm.description = ''
  editorForm.coverImage = ''
  editorForm.applyBeginTime = ''
  editorForm.applyEndTime = ''
  editorForm.activityBeginTime = ''
  editorForm.activityEndTime = ''
  editorForm.sort = 1
  editorForm.remark = ''
}

function openCreate() {
  detailVisible.value = false
  revokeLocalCover()
  clearEditorErrors()
  editorId.value = ''
  resetEditorForm()
  editorVisible.value = true
}

function openEditor(row: SeckillActivity) {
  detailVisible.value = false
  revokeLocalCover()
  clearEditorErrors()
  editorId.value = row.id
  editorForm.name = row.name || ''
  editorForm.description = row.description || ''
  editorForm.coverImage = row.coverImage || ''
  editorForm.applyBeginTime = toEditorTime(row.applyBeginTime)
  editorForm.applyEndTime = toEditorTime(row.applyEndTime)
  editorForm.activityBeginTime = toEditorTime(row.activityBeginTime)
  editorForm.activityEndTime = toEditorTime(row.activityEndTime)
  editorForm.sort = Number(row.sort) || 1
  editorForm.remark = row.remark || ''
  editorVisible.value = true
}

function handleTimeChange() {
  editorErrors.applyTime = ''
  editorErrors.activityTime = ''
  editorErrors.sequence = ''
}

function revokeLocalCover() {
  if (localCoverUrl.value) {
    URL.revokeObjectURL(localCoverUrl.value)
    localCoverUrl.value = ''
  }
}

function handleEditorClosed() {
  revokeLocalCover()
  clearEditorErrors()
}

function validateEditor() {
  clearEditorErrors()
  const name = editorForm.name.trim()
  const description = editorForm.description.trim()
  if (!name) {
    editorErrors.name = '请输入活动名称'
  }
  if (!description) {
    editorErrors.description = '请输入活动描述'
  }
  if (!editorForm.sort || Number(editorForm.sort) < 1) {
    editorErrors.sort = '排序需大于等于 1'
  }
  if (!editorForm.coverImage) {
    editorErrors.cover = '请上传活动封面'
  }

  const applyBegin = displayTime(editorForm.applyBeginTime)
  const applyEnd = displayTime(editorForm.applyEndTime)
  const activityBegin = displayTime(editorForm.activityBeginTime)
  const activityEnd = displayTime(editorForm.activityEndTime)

  if (!applyBegin || !applyEnd) {
    editorErrors.applyTime = '请选择完整的报名开始和结束时间'
  } else if (applyBegin >= applyEnd) {
    editorErrors.applyTime = '报名开始时间需早于结束时间'
  }
  if (!activityBegin || !activityEnd) {
    editorErrors.activityTime = '请选择完整的活动开始和结束时间'
  } else if (activityBegin >= activityEnd) {
    editorErrors.activityTime = '活动开始时间需早于结束时间'
  }
  if (
    !editorErrors.applyTime
    && !editorErrors.activityTime
    && applyEnd > activityBegin
  ) {
    editorErrors.sequence = '报名截止时间需早于活动开始时间，请调整后再保存。'
  }

  return !Object.values(editorErrors).some(Boolean)
}

async function saveEditor() {
  if (coverUploading.value) {
    ElMessage.warning('封面正在上传，请稍候')
    return
  }
  if (!validateEditor() || !editorForm.sort) {
    return
  }

  const payload = {
    name: editorForm.name.trim(),
    description: editorForm.description.trim(),
    coverImage: editorForm.coverImage,
    applyBeginTime: displayTime(editorForm.applyBeginTime),
    applyEndTime: displayTime(editorForm.applyEndTime),
    activityBeginTime: displayTime(editorForm.activityBeginTime),
    activityEndTime: displayTime(editorForm.activityEndTime),
    sort: Number(editorForm.sort),
    remark: editorForm.remark.trim(),
  }

  editorSaving.value = true
  try {
    if (editorId.value) {
      await updateSeckillActivity({ ...payload, id: editorId.value })
      ElMessage.success('活动信息已保存')
    } else {
      await createSeckillActivity(payload)
      activeTab.value = 'all'
      page.current = 1
      ElMessage.success('活动已创建，请配置场次后发布')
    }
    editorVisible.value = false
    await refreshAll()
  } catch {
    // 请求错误已由全局拦截器提示
  } finally {
    editorSaving.value = false
  }
}

function beforeCoverUpload(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  if (!['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
    ElMessage.warning('仅支持 JPG、PNG、WebP 格式的图片')
    return false
  }
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.warning('封面图片不能超过 2MB')
    return false
  }
  return true
}

async function uploadCover(options: UploadRequestOptions) {
  coverUploading.value = true
  revokeLocalCover()
  localCoverUrl.value = URL.createObjectURL(options.file)
  try {
    const response = (await uploadStorageFile({
      file: options.file,
      isPublic: true,
      isUsed: false,
    })) as { data: { fileKey: string } }
    editorForm.coverImage = response.data.fileKey
    editorErrors.cover = ''
    options.onSuccess(response.data)
    ElMessage.success('封面上传成功')
  } catch (error) {
    revokeLocalCover()
    options.onError(error as Parameters<typeof options.onError>[0])
  } finally {
    coverUploading.value = false
  }
}

async function toggleEnabled(row: SeckillActivity) {
  const nextEnabled = row.isEnabled
  toggleLoadingId.value = row.id
  try {
    await updateSeckillActivityEnabled({ id: row.id, isEnabled: nextEnabled })
    ElMessage.success(`活动已${nextEnabled ? '启用' : '停用'}`)
    if (detailRow.value?.id === row.id) {
      detailRow.value.isEnabled = nextEnabled
    }
    const listChanged = applied.enabled !== '' && applied.enabled !== nextEnabled
    await Promise.all([loadStats(), listChanged ? loadList() : Promise.resolve()])
  } catch {
    row.isEnabled = !nextEnabled
  } finally {
    toggleLoadingId.value = null
  }
}

function openTransition(row: SeckillActivity) {
  const meta = statusMeta(row.status)
  if (!meta.action) {
    return
  }
  transition.row = { ...row }
  transition.meta = meta
  transition.visible = true
}

function goSessionsFromTransition() {
  const row = transition.row
  if (!row) {
    return
  }
  transition.visible = false
  goSessions(row)
}

async function confirmTransition() {
  if (!transition.row || !transition.meta) {
    return
  }
  if (isPublishTransition.value && transitionChecks.value.fail) {
    return
  }
  const rowId = transition.row.id
  const nextStatus = transition.meta.next
  const action = transition.meta.action
  transitionSaving.value = true
  try {
    await updateSeckillActivityStatus({ id: rowId, status: nextStatus })
    ElMessage.success(`活动已${action}`)
    if (detailRow.value?.id === rowId) {
      detailRow.value.status = nextStatus
    }
    transition.visible = false
    await refreshAll()
  } catch {
    // 请求错误已由全局拦截器提示
  } finally {
    transitionSaving.value = false
  }
}

async function confirmDelete() {
  if (!deletingRow.value) {
    return
  }
  const rowId = deletingRow.value.id
  deleteSaving.value = true
  try {
    await deleteSeckillActivity([rowId])
    ElMessage.success('活动已删除')
    if (detailRow.value?.id === rowId) {
      detailRow.value = null
      detailVisible.value = false
    }
    deleteVisible.value = false
    await refreshAll()
  } catch {
    // 请求错误已由全局拦截器提示
  } finally {
    deleteSaving.value = false
  }
}

onMounted(() => {
  void refreshAll()
})

onBeforeUnmount(() => {
  revokeLocalCover()
})
</script>

<style scoped>
.sk-status-tabs {
  display: flex;
  min-height: 40px;
  align-items: center;
  gap: 2px;
  margin: 0 0 8px;
  padding: 0 2px;
  overflow-x: auto;
  scrollbar-width: none;
}

.sk-status-tabs::-webkit-scrollbar {
  display: none;
}

.sk-tab {
  display: inline-flex;
  height: 34px;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
  padding: 0 11px;
  color: var(--ym-muted);
  border: 0;
  border-radius: 6px;
  background: transparent;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
}

.sk-tab:hover {
  color: var(--ym-ink);
  background: #fff;
}

.sk-tab.active {
  color: var(--ym-brand);
  background: var(--ym-brand-soft);
  font-weight: 600;
}

.sk-tab-count {
  display: inline-grid;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  place-items: center;
  color: var(--ym-muted);
  border-radius: 9px;
  background: rgba(23, 37, 31, 0.06);
  font-size: 10px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.sk-tab[data-status='1'] .sk-tab-count {
  color: var(--ym-warning);
  background: var(--ym-warning-soft);
}

.sk-tab.active .sk-tab-count {
  color: #fff;
  background: var(--ym-brand);
}

.sk-tab[data-status='1'].active .sk-tab-count {
  color: #fff;
  background: var(--ym-warning);
}

.seckill-activity-page :deep(.mall-filter-panel .el-input) {
  width: 220px;
}

.seckill-activity-page :deep(.mall-filter-panel .el-select) {
  width: 150px;
}

.sk-table-intro {
  display: flex;
  min-height: 38px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 14px;
  color: var(--ym-muted);
  border-bottom: 1px solid var(--ym-line);
  background: var(--ym-row-hover);
  font-size: 12px;
  line-height: 1.5;
}

.sk-table-intro > span {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.sk-table-intro .el-icon {
  flex: 0 0 auto;
  color: var(--ym-brand);
}

.sk-intro-right {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
}

.sk-intro-right > b {
  color: var(--ym-ink-secondary);
  font-size: 11px;
  font-weight: 600;
}

.sk-setup-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  color: var(--ym-warning);
  border-radius: 4px;
  background: var(--ym-warning-soft);
  font-size: 11px;
}

.sk-activity-table :deep(.el-table__cell) {
  vertical-align: middle;
}

.sk-activity-cell {
  display: flex;
  width: 250px;
  max-width: 100%;
  min-width: 0;
  align-items: center;
  justify-content: flex-start !important;
  gap: 10px;
  margin: 0 auto;
  text-align: left;
}

.sk-cover-art {
  position: relative;
  display: block;
  width: 88px;
  height: 44px;
  flex: 0 0 88px;
  overflow: hidden;
  border: 1px solid var(--ym-line);
  border-radius: 6px;
  background: var(--ym-row-line);
}

.sk-cover-art.small {
  width: 72px;
  height: 36px;
  flex-basis: 72px;
}

.sk-cover-art :deep(.el-image) {
  display: block;
  width: 100%;
  height: 100%;
}

.sk-cover-fallback {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: #91a39a;
  background: linear-gradient(135deg, #eef4f0, #e2ebe5);
  font-size: 18px;
}

.sk-cover-art .sk-cover-fallback {
  position: absolute;
  inset: 0;
}

.sk-activity-copy {
  display: flex;
  min-width: 0;
  flex: 1 1 0;
  max-width: 152px;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  text-align: left;
}

.sk-name-link {
  max-width: 100%;
  padding: 0;
  overflow: hidden;
  color: var(--ym-ink);
  border: 0;
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.sk-name-link:hover {
  color: var(--ym-brand);
}

.sk-activity-copy small {
  display: block;
  width: 100%;
  overflow: hidden;
  color: var(--ym-muted);
  font-size: 12px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sk-when-cell {
  display: flex;
  width: max-content;
  max-width: 100%;
  margin: 0 auto;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.sk-when-cell i {
  color: #91a39a;
  font-style: normal;
}

.sk-when-empty {
  color: var(--ym-muted);
}

.sk-session-link {
  display: inline-flex;
  min-width: 48px;
  height: 26px;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  color: var(--ym-brand);
  border: 0;
  border-radius: 5px;
  background: var(--ym-brand-soft);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}

.sk-session-link:hover {
  background: #dbebe3;
}

.sk-session-link.is-empty {
  color: var(--ym-danger);
  background: var(--ym-danger-soft);
}

.sk-ticket {
  display: inline-flex;
  min-height: 24px;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  color: var(--ym-muted);
  border: 1px solid var(--ym-line-strong);
  border-radius: 5px;
  background: var(--ym-surface-2);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.sk-ticket.tone-success {
  color: var(--ym-brand);
  border-color: #c7d8de;
  background: var(--ym-brand-soft);
}

.sk-ticket.tone-warning {
  color: var(--ym-warning);
  border-color: #ead3b1;
  background: var(--ym-warning-soft);
}

.sk-ticket.tone-info {
  color: var(--ym-info);
  border-color: #bfd3da;
  background: var(--ym-info-soft);
}

.sk-switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ym-muted);
  font-size: 12px;
  white-space: nowrap;
}

.sk-switch span.is-on {
  color: var(--ym-brand);
}

.sk-switch :deep(.el-switch) {
  --el-switch-on-color: var(--ym-brand);
}

.mall-actions-column .sk-row-actions {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  white-space: nowrap;
}

.mall-actions-column .sk-row-actions :deep(.el-button) {
  margin-left: 0;
  padding: 4px 5px;
  font-size: 12px;
}

.mall-actions-column .sk-row-actions :deep(.el-dropdown) {
  margin-left: 0;
}

.sk-next-link {
  font-weight: 600;
}

.sk-more-btn {
  color: var(--ym-muted);
}

.sk-more-icon {
  margin-left: 2px;
}

.sk-empty {
  display: flex;
  min-height: 210px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 7px;
  color: var(--ym-muted);
}

.sk-empty .el-icon {
  font-size: 28px;
}

.sk-empty b {
  color: var(--ym-ink);
  font-size: 13px;
}

.sk-empty span {
  font-size: 11px;
}

/* Dialog / drawer content is teleported outside the page shell. */
:global(.el-overlay .el-dialog.sk-custom-dialog .el-dialog__header) {
  display: none;
}


.sk-detail,
.sk-editor,
.sk-transition,
.sk-delete {
  color: var(--ym-ink);
}

.sk-dialog-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--ym-line);
}

.sk-kicker {
  color: var(--ym-brand);
  font-family: var(--ym-font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.sk-dialog-head h2 {
  margin: 2px 0 0;
  color: var(--ym-ink);
  font-size: 18px;
  line-height: 1.35;
}

.sk-close-btn {
  display: inline-grid;
  width: 29px;
  height: 29px;
  flex: 0 0 29px;
  place-items: center;
  color: var(--ym-muted);
  border: 1px solid var(--ym-line);
  border-radius: 6px;
  background: #fff;
  font-size: 15px;
  cursor: pointer;
}

.sk-close-btn:hover {
  color: var(--ym-brand);
  border-color: var(--ym-brand);
}

.sk-detail-hero {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  align-items: start;
  gap: 16px;
  margin-top: 16px;
}

.sk-detail-cover {
  position: relative;
  display: block;
  width: 160px;
  height: 80px;
  overflow: hidden;
  border: 1px solid var(--ym-line);
  border-radius: 8px;
  background: var(--ym-row-line);
}

.sk-detail-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
}

.sk-detail-copy h3 {
  margin: 0;
  color: var(--ym-ink);
  font-size: 17px;
  line-height: 1.4;
}

.sk-detail-copy .sk-ticket {
  margin-top: 8px;
}

.sk-detail-copy p {
  margin: 8px 0 0;
  color: var(--ym-muted);
  font-size: 12px;
  line-height: 1.6;
}

.sk-detail-times,
.sk-detail-meta {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.sk-detail-times {
  grid-template-columns: 1fr;
  gap: 8px;
}

.sk-detail-meta {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.sk-detail-times > div,
.sk-detail-meta > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border: 1px solid var(--ym-line);
  border-radius: 7px;
  background: var(--ym-row-hover);
  text-align: left;
}

.sk-detail-times > div {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 12px;
}

.sk-detail-times span,
.sk-detail-meta span {
  color: var(--ym-muted);
  font-size: 11px;
}

.sk-detail-times b,
.sk-detail-meta b {
  color: var(--ym-ink-secondary);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
}

.sk-detail-times b {
  white-space: nowrap;
}

.sk-drawer-section {
  margin-top: 18px;
}

.sk-drawer-section h3 {
  margin: 0 0 8px;
  color: var(--ym-ink);
  font-size: 13px;
}

.sk-flow {
  display: flex;
  align-items: flex-start;
  margin-top: 8px;
}

.sk-flow-step {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  text-align: center;
}

.sk-flow-step::after {
  position: absolute;
  top: 5px;
  left: 50%;
  width: 100%;
  height: 1px;
  background: var(--ym-line-strong);
  content: '';
}

.sk-flow-step:last-child::after {
  display: none;
}

.sk-flow-step i {
  position: relative;
  z-index: 1;
  width: 11px;
  height: 11px;
  border: 2px solid var(--ym-line-strong);
  border-radius: 50%;
  background: #fff;
}

.sk-flow-step small {
  color: var(--ym-muted);
  font-size: 10px;
  white-space: nowrap;
}

.sk-flow-step.is-done::after {
  background: var(--ym-brand);
}

.sk-flow-step.is-done i {
  border-color: var(--ym-brand);
  background: var(--ym-brand);
}

.sk-flow-step.is-current i {
  box-shadow: 0 0 0 3px rgba(36, 99, 79, 0.15);
}

.sk-flow-step.is-current small {
  color: var(--ym-brand);
  font-weight: 600;
}

.sk-detail-remark {
  margin: 0;
  color: var(--ym-ink-secondary);
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.sk-drawer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 22px;
}

.sk-drawer-actions :deep(.el-button) {
  min-width: 82px;
}

.sk-dialog-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 12px;
  color: var(--ym-ink-secondary);
  border: 1px solid #d5e2e7;
  border-radius: 7px;
  background: var(--ym-brand-soft);
  font-size: 12px;
  line-height: 1.55;
}

.sk-dialog-note .el-icon {
  flex: 0 0 auto;
  margin-top: 1px;
  color: var(--ym-brand);
}

.sk-form-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 12px 16px;
  margin-top: 14px;
}

.sk-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.sk-field.wide {
  grid-column: 1 / -1;
}

.sk-field > span {
  color: var(--ym-ink-secondary);
  font-size: 12px;
  font-weight: 600;
}

.sk-field > span small {
  color: var(--ym-muted);
  font-size: 11px;
  font-weight: 400;
}

.sk-required {
  color: var(--ym-danger);
  font-style: normal;
}

.sk-field-error {
  color: var(--ym-danger) !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  line-height: 1.4;
}

.sk-field.is-invalid :deep(.el-input__wrapper),
.sk-field.is-invalid :deep(.el-select__wrapper),
.sk-field.is-invalid :deep(.el-textarea__inner),
.sk-field.is-invalid :deep(.el-date-editor.el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--ym-danger) inset;
}

.sk-cover-editor {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px;
  border: 1px solid var(--ym-line);
  border-radius: 8px;
  background: var(--ym-row-hover);
}

.sk-cover-preview {
  position: relative;
  display: block;
  width: 180px;
  height: 90px;
  flex: 0 0 180px;
  overflow: hidden;
  border: 1px solid var(--ym-line);
  border-radius: 6px;
  background: var(--ym-row-line);
}

.sk-cover-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 7px;
}

.sk-cover-copy :deep(.el-upload) {
  display: block;
}

.sk-cover-copy small {
  color: var(--ym-muted);
  font-size: 11px;
  font-weight: 400;
  line-height: 1.55;
}

.sk-upload-btn {
  height: 32px;
  padding: 0 11px;
  color: var(--ym-brand);
  border-color: var(--ym-line-strong);
  background: #fff;
  font-size: 12px;
}

.sk-upload-btn:hover,
.sk-upload-btn:focus {
  color: var(--ym-brand);
  border-color: var(--ym-brand);
  background: var(--ym-brand-soft);
}

.sk-time-inputs {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: end;
  gap: 8px;
}

.sk-time-inputs label {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.sk-time-inputs label small {
  color: var(--ym-muted);
  font-size: 10px;
  font-weight: 500;
}

.sk-time-inputs > i {
  align-self: center;
  margin-top: 15px;
  color: #91a39a;
  font-style: normal;
}

.sk-sequence-error {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 12px 0 0;
  padding: 8px 10px;
  color: var(--ym-danger);
  border: 1px solid #e7bfbb;
  border-radius: 6px;
  background: var(--ym-danger-soft);
  font-size: 11px;
}

.sk-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

.sk-dialog-actions :deep(.el-button) {
  min-width: 90px;
}

.sk-delete-confirm-btn {
  --el-button-bg-color: var(--ym-danger);
  --el-button-border-color: var(--ym-danger);
  --el-button-hover-bg-color: #a93630;
  --el-button-hover-border-color: #a93630;
  --el-button-active-bg-color: #96302b;
  --el-button-active-border-color: #96302b;
}

.sk-transition-context {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px;
  border: 1px solid var(--ym-line);
  border-radius: 8px;
  background: var(--ym-row-hover);
}

.sk-transition-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 3px;
  text-align: left;
}

.sk-transition-copy b {
  overflow: hidden;
  color: var(--ym-ink);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sk-transition-copy small {
  overflow: hidden;
  color: var(--ym-muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sk-transition-shift {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
}

.sk-transition-shift .el-icon {
  color: var(--ym-muted);
  font-size: 14px;
}

.sk-transition-hint {
  margin: 14px 0 0;
  color: var(--ym-ink-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.sk-check {
  margin-top: 14px;
  padding: 12px;
  border: 1px solid var(--ym-line);
  border-radius: 7px;
  background: var(--ym-row-hover);
}

.sk-check.is-fail {
  border-color: #ecc9c3;
  background: var(--ym-danger-soft);
}

.sk-check.is-pass {
  border-color: #c7d8de;
  background: var(--ym-brand-soft);
}

.sk-check > b {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.sk-check.is-fail > b {
  color: var(--ym-danger);
}

.sk-check.is-pass > b {
  color: var(--ym-brand);
}

.sk-check-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.sk-check-list li {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--ym-ink-secondary);
  font-size: 11px;
}

.sk-check-list li i {
  width: 6px;
  height: 6px;
  flex: 0 0 6px;
  border-radius: 50%;
  background: var(--ym-brand);
}

.sk-check-list li.is-bad {
  color: var(--ym-danger);
}

.sk-check-list li.is-bad i {
  background: var(--ym-danger);
}

.sk-danger-confirm {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  align-items: start;
  gap: 11px;
  margin-top: 16px;
  padding: 14px;
  color: var(--ym-danger);
  border: 1px solid #ecc9c3;
  border-radius: 7px;
  background: var(--ym-danger-soft);
}

.sk-danger-confirm > .el-icon {
  margin-top: 1px;
  font-size: 18px;
}

.sk-danger-confirm > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
}

.sk-danger-confirm b {
  color: #82382d;
  font-size: 13px;
}

.sk-danger-confirm span {
  color: #8f4b40;
  font-size: 11px;
  line-height: 1.5;
}

.sk-danger-confirm small {
  color: #99645b;
  font-size: 10px;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.sk-delete-context {
  margin: 12px 0 0;
  color: var(--ym-ink-secondary);
  font-size: 12px;
}

:global(.sk-row-menu .el-dropdown-menu__item) {
  font-size: 12px;
}

:global(.sk-row-menu .el-dropdown-menu__item:not(.is-disabled).sk-danger-action) {
  color: var(--ym-danger);
}

:global(.sk-row-menu .el-dropdown-menu__item:not(.is-disabled).sk-danger-action:hover) {
  color: var(--ym-danger);
  background: var(--ym-danger-soft);
}

@media (max-width: 900px) {
  .sk-table-intro {
    align-items: flex-start;
    flex-direction: column;
  }

  .sk-intro-right {
    align-self: flex-end;
  }

  .sk-detail-hero {
    grid-template-columns: 1fr;
  }

  .sk-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
