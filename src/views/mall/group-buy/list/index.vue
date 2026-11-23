<template>
  <div class="mall-page groupbuy-page groupbuy-activity-page">
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
        {{ groupbuyStatusMeta(status).label }}<span class="sk-tab-count">{{ tabCount(status) }}</span>
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

    <section class="mall-table-panel">
      <div class="sk-table-intro">
        <span><el-icon><Clock /></el-icon>发布前需设置成团人数（≥2）与最大开团数；报名与活动时间段允许重叠，但各自起止需有效。</span>
        <div class="sk-intro-right">
          <span v-if="stats.pendingSetup > 0" class="sk-setup-chip">
            <el-icon><WarningFilled /></el-icon>{{ stats.pendingSetup }} 个待完善规则
          </span>
          <b>共 {{ page.total }} 个活动</b>
        </div>
      </div>

      <el-table data-ym-table="r71"
        v-loading="loading"
        :data="pagedRows"
        row-key="id"
      >
        <el-table-column label="活动信息" min-width="240">
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

        <el-table-column label="报名时间" min-width="162">
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

        <el-table-column label="活动时间" min-width="162">
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

        <el-table-column label="成团人数" min-width="72">
          <template #default="{ row }">{{ row.minPeople }} 人</template>
        </el-table-column>

        <el-table-column label="开团上限" min-width="78">
          <template #default="{ row }">{{ groupbuyLimitText(row.groupLimit) }}</template>
        </el-table-column>

        <el-table-column label="报名 / 商品" min-width="92">
          <template #default="{ row }">
            <div class="gb-link-stack">
              <el-button
                link
                type="primary"
                :class="{ 'is-zero': !row.applyCount }"
                @click="goAudit(row)"
              >
                报名 {{ row.applyCount }}
              </el-button>
              <el-button
                link
                type="primary"
                :class="{ 'is-zero': !row.productCount }"
                @click="goProduct(row)"
              >
                商品 {{ row.productCount }}
              </el-button>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" min-width="82">
          <template #default="{ row }">
            <span class="status-ticket" :class="`tone-${groupbuyStatusMeta(row.status).tone}`">
              {{ groupbuyStatusMeta(row.status).label }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="sort" label="排序" min-width="54" />

        <el-table-column label="启用" min-width="90">
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

        <el-table-column label="操作" width="150" fixed="right" class-name="mall-actions-column">
          <template #default="{ row }">
            <div class="gb-operations">
              <el-button
                v-if="groupbuyStatusMeta(row.status).action"
                link
                type="primary"
                class="gb-next-link"
                @click="openTransition(row)"
              >
                {{ groupbuyStatusMeta(row.status).action }}
              </el-button>
              <el-button v-else link type="primary" @click="openDetail(row)">详情</el-button>
              <el-button
                link
                type="primary"
                :disabled="!canEdit(row)"
                :title="canEdit(row) ? '' : '活动已结束，不可编辑'"
                @click="canEdit(row) && openEditor(row)"
              >
                编辑
              </el-button>
              <el-dropdown
                trigger="click"
                popper-class="gb-row-menu"
                @command="handleRowCommand($event, row)"
              >
                <el-button link class="gb-more-btn">
                  更多<el-icon class="gb-more-icon"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="detail">查看详情</el-dropdown-item>
                    <el-dropdown-item command="audit">申请审核</el-dropdown-item>
                    <el-dropdown-item command="product">商品管理</el-dropdown-item>
                    <el-dropdown-item command="order">订单管理</el-dropdown-item>
                    <el-dropdown-item
                      command="delete"
                      divided
                      :disabled="row.status !== '1'"
                      :title="row.status !== '1' ? '仅新建状态的活动可删除' : ''"
                      class="gb-danger-action"
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
          <div class="gb-empty">
            <el-icon><Calendar /></el-icon>
            <b>没有匹配的拼团活动</b>
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

    <el-drawer v-model="detailVisible" size="560px" class="gb-scope" :with-header="false" :show-close="false">
      <div v-if="detailRow" class="sk-detail">
        <div class="sk-dialog-head">
          <div>
            <span class="sk-kicker">GROUP BUY ACTIVITY</span>
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
            <span class="status-ticket" :class="`tone-${groupbuyStatusMeta(detailRow.status).tone}`">
              {{ groupbuyStatusMeta(detailRow.status).label }}
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
            <span>成团人数</span>
            <b>{{ detailRow.minPeople }} 人 / 团</b>
          </div>
          <div>
            <span>最大开团数</span>
            <b>{{ groupbuyLimitText(detailRow.groupLimit) }}</b>
          </div>
          <div>
            <span>报名 / 通过商品</span>
            <b>{{ detailRow.applyCount }} 条 / {{ detailRow.productCount }} 款</b>
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

        <div class="gb-play-note">
          <el-icon><Avatar /></el-icon>
          <span>拼团玩法：用户开团后邀请好友参团，每团满 {{ detailRow.minPeople }} 人即成团；活动结束时统一结算——满团订单进入待发货，未满团自动关闭或退款，并释放剩余预留库存。</span>
        </div>

        <div class="sk-drawer-section">
          <h3>活动进度</h3>
          <div class="sk-flow">
            <span
              v-for="(step, index) in GROUPBUY_FLOW"
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
          <el-button @click="goOrder(detailRow)">订单管理</el-button>
          <el-button type="primary" :disabled="!canEdit(detailRow)" @click="canEdit(detailRow) && openEditor(detailRow)">
            编辑活动
          </el-button>
        </div>
      </div>
    </el-drawer>

    <el-dialog
      v-model="editorVisible"
      width="780px"
      class="sk-custom-dialog sk-editor-dialog gb-scope"
      :with-header="false"
      :show-close="false"
      :close-on-click-modal="false"
      @closed="handleEditorClosed"
    >
      <div class="sk-editor">
        <div class="sk-dialog-head">
          <div>
            <span class="sk-kicker">GROUP BUY ACTIVITY</span>
            <h2>{{ editorId ? '编辑活动' : '新建活动' }}</h2>
          </div>
          <button type="button" class="sk-close-btn" @click="editorVisible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>

        <div class="sk-dialog-note">
          <el-icon><Avatar /></el-icon>
          <span>拼团活动需设置成团人数与最大开团数；报名与活动时间段允许重叠。保存后可在列表按阶段推进活动状态，活动结束将统一结算。</span>
        </div>

        <div class="sk-form-grid">
          <label class="sk-field" :class="{ 'is-invalid': editorErrors.name }">
            <span>活动名称 <em class="sk-required">*</em></span>
            <el-input
              v-model="editorForm.name"
              maxlength="64"
              placeholder="例如：秋日好物双人团"
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
              placeholder="简要说明活动商品与拼团玩法"
              @input="clearEditorError('description')"
            />
            <small v-if="editorErrors.description" class="sk-field-error">{{ editorErrors.description }}</small>
          </label>

          <div class="sk-field wide">
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
                      : '建议 640×320（2:1），支持 JPG / PNG / WebP，单张不超过 2MB；未上传时使用示意封面。'
                  }}
                </small>
              </span>
            </div>
          </div>

          <div class="sk-field wide">
            <span>拼团规则 <em class="sk-required">*</em></span>
            <div class="gb-rule-grid">
              <label class="sk-field" :class="{ 'is-invalid': editorErrors.minPeople }">
                <span>成团人数</span>
                <el-input-number
                  v-model="editorForm.minPeople"
                  :min="2"
                  :precision="0"
                  :controls="false"
                  style="width: 100%"
                  @change="clearEditorError('minPeople')"
                />
                <small class="gb-rule-hint">每团满此人数即成团，至少 2 人。</small>
                <small v-if="editorErrors.minPeople" class="sk-field-error">{{ editorErrors.minPeople }}</small>
              </label>
              <label class="sk-field" :class="{ 'is-invalid': editorErrors.groupLimit }">
                <span>最大开团数</span>
                <el-input-number
                  :model-value="limitUnlimited ? null : editorForm.groupLimit"
                  :min="1"
                  :precision="0"
                  :controls="false"
                  :disabled="limitUnlimited"
                  style="width: 100%"
                  @update:model-value="handleGroupLimitInput"
                />
                <span class="gb-limit-toggle">
                  <el-checkbox :model-value="limitUnlimited" @change="handleLimitToggle">不限制开团数</el-checkbox>
                </span>
                <small v-if="editorErrors.groupLimit" class="sk-field-error">{{ editorErrors.groupLimit }}</small>
              </label>
            </div>
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
      class="sk-custom-dialog gb-scope"
      :with-header="false"
      :show-close="false"
    >
      <div v-if="transition.row && transition.meta" class="sk-transition">
        <div class="sk-dialog-head">
          <div>
            <span class="sk-kicker">GROUP BUY WORKFLOW</span>
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
            <small>报名 {{ shortTime(transition.row.applyBeginTime) }} → {{ shortTime(transition.row.applyEndTime) }}</small>
            <small>活动 {{ shortTime(transition.row.activityBeginTime) }} → {{ shortTime(transition.row.activityEndTime) }}</small>
          </span>
          <span class="sk-transition-shift">
            <span class="status-ticket" :class="`tone-${transition.meta.tone}`">{{ transition.meta.label }}</span>
            <el-icon><ArrowRight /></el-icon>
            <span
              v-if="transitionNextMeta"
              class="status-ticket"
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
            <el-icon v-if="transitionChecks.fail"><WarningFilled /></el-icon>
            <el-icon v-else><Check /></el-icon>
            {{ transitionChecks.fail ? '发布前检查未通过' : '发布前检查通过' }}
          </b>
          <ul class="sk-check-list">
            <li :class="{ 'is-bad': !transitionChecks.timeConfigured }"><i></i>报名与活动时间段已配置</li>
            <li :class="{ 'is-bad': !transitionChecks.orderOk }"><i></i>各时间段起止有效</li>
            <li :class="{ 'is-bad': !transitionChecks.minPeopleOk }"><i></i>成团人数 ≥ 2 人（当前 {{ transition.row.minPeople }} 人）</li>
            <li :class="{ 'is-bad': !transitionChecks.limitOk }"><i></i>最大开团数已设置（{{ groupbuyLimitText(transition.row.groupLimit) }}）</li>
          </ul>
        </div>

        <p class="sk-transition-hint">{{ transition.meta.hint }}</p>

        <div class="sk-dialog-actions">
          <el-button @click="transition.visible = false">取消</el-button>
          <el-button
            v-if="isPublishTransition && transitionChecks.fail"
            @click="goEditFromTransition"
          >
            前往完善规则
          </el-button>
          <el-button
            type="primary"
            :disabled="transitionChecks.fail"
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
      class="sk-custom-dialog gb-scope"
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
          <el-icon><WarningFilled /></el-icon>
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
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { UploadRequestOptions } from 'element-plus'
import {
  ArrowDown,
  ArrowRight,
  Avatar,
  Calendar,
  Check,
  Clock,
  Close,
  Picture,
  Plus,
  Search,
  Upload,
  WarningFilled,
} from '@element-plus/icons-vue'
import {
  createGroupBuyActivity,
  deleteGroupBuyActivity,
  queryGroupBuyActivityList,
  queryGroupBuyActivityStats,
  updateGroupBuyActivity,
  updateGroupBuyActivityEnabled,
  updateGroupBuyActivityStatus,
} from '@/api/mall/groupBuy'
import { uploadStorageFile } from '@/api/storage'
import { getStoragePreviewUrl } from '@/utils/storage'
import MallPagination from '@/components/mall/MallPagination.vue'
import StorageImage from '@/components/mall/StorageImage.vue'
import { fullRange, type PageResponse } from '../../seckill/insight-shared'
import {
  GROUPBUY_AUDIT_PATH,
  GROUPBUY_FLOW,
  GROUPBUY_ORDER_PATH,
  GROUPBUY_PRODUCT_PATH,
  groupbuyLimitText,
  groupbuyPublishIssues,
  groupbuyStatusMeta,
  shortTime,
  type GroupBuyActivity,
  type GroupBuyStatusMeta,
} from '../groupbuy-shared'

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

const STATUS_ORDER = ['1', '2', '3', '4', '5', '6', '7']
const STATUS_COUNT_KEY: Record<string, keyof ActivityStats> = {
  1: 'created',
  2: 'published',
  3: 'applyStarted',
  4: 'applyFinished',
  5: 'activityStarted',
  6: 'activityFinished',
  7: 'activityDown',
}

const router = useRouter()

const activeTab = ref('all')
const loading = ref(false)
const allRows = ref<GroupBuyActivity[]>([])
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

const filtered = computed(() => (
  activeTab.value === 'all'
    ? allRows.value
    : allRows.value.filter((row) => String(row.status) === activeTab.value)
))
const pagedRows = computed(() => filtered.value.slice((page.current - 1) * page.size, page.current * page.size))

watch(filtered, (rows) => {
  page.total = rows.length
  const maxPage = Math.max(1, Math.ceil(rows.length / page.size))
  if (page.current > maxPage) page.current = maxPage
}, { immediate: true })

const detailVisible = ref(false)
const detailRow = ref<GroupBuyActivity | null>(null)
const currentFlowIndex = computed(() => {
  if (!detailRow.value) return -1
  return GROUPBUY_FLOW.findIndex((step) => step.value === String(detailRow.value?.status))
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
  minPeople: 2 as number | null,
  groupLimit: 0 as number | null,
  sort: 1 as number | null,
  remark: '',
})
const editorErrors = reactive({
  name: '',
  description: '',
  sort: '',
  minPeople: '',
  groupLimit: '',
  applyTime: '',
  activityTime: '',
})
const coverPreviewUrl = computed(() => {
  if (localCoverUrl.value) return localCoverUrl.value
  return editorForm.coverImage ? getStoragePreviewUrl(editorForm.coverImage) : ''
})
const limitUnlimited = computed(() => Number(editorForm.groupLimit) === -1)

const transition = reactive<{
  visible: boolean
  row: GroupBuyActivity | null
  meta: GroupBuyStatusMeta | null
}>({ visible: false, row: null, meta: null })
const transitionSaving = ref(false)
const transitionNextMeta = computed(() => {
  if (!transition.meta?.next) return null
  return groupbuyStatusMeta(transition.meta.next)
})
const isPublishTransition = computed(() => transition.meta?.next === '2')
const transitionIssues = computed(() => (
  isPublishTransition.value && transition.row ? groupbuyPublishIssues(transition.row) : []
))
const transitionChecks = computed(() => {
  const row = transition.row
  if (!row) {
    return { timeConfigured: false, orderOk: false, minPeopleOk: false, limitOk: false, fail: true }
  }
  const timeConfigured = Boolean(row.applyBeginTime && row.applyEndTime && row.activityBeginTime && row.activityEndTime)
  const orderOk = timeConfigured
    && String(row.applyBeginTime) <= String(row.applyEndTime)
    && String(row.activityBeginTime) <= String(row.activityEndTime)
  const minPeopleOk = Number(row.minPeople) >= 2
  const limitOk = Number(row.groupLimit) !== 0
  return { timeConfigured, orderOk, minPeopleOk, limitOk, fail: transitionIssues.value.length > 0 }
})

const deleteVisible = ref(false)
const deleteSaving = ref(false)
const deletingRow = ref<GroupBuyActivity | null>(null)

function tabCount(status: string) {
  const key = STATUS_COUNT_KEY[status]
  return key ? stats[key] : 0
}

function displayTime(value?: string | null) {
  return String(value || '').replace('T', ' ').slice(0, 19)
}

function canEdit(row: GroupBuyActivity) {
  return !['6', '7'].includes(String(row.status))
}

function buildQuery(source: { keyword: string; enabled: boolean | '' }) {
  const params: Record<string, unknown> = {}
  if (source.keyword) params.keyword = source.keyword
  if (source.enabled !== '') params.isEnabled = source.enabled
  return params
}

async function loadStats() {
  try {
    const response = await queryGroupBuyActivityStats(buildQuery(applied)) as { data?: Partial<ActivityStats> }
    const data = response?.data || {}
    const keys: (keyof ActivityStats)[] = [
      'total', 'created', 'published', 'applyStarted', 'applyFinished',
      'activityStarted', 'activityFinished', 'activityDown', 'pendingSetup',
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
    const result = await queryGroupBuyActivityList({
      current: 1,
      size: 500,
      ...buildQuery(applied),
    }) as unknown as PageResponse<GroupBuyActivity>
    allRows.value = (result.data?.records || [])
      .filter((row) => row && row.id !== undefined && row.id !== null)
      .map((row) => ({
        ...row,
        name: String(row.name || ''),
        description: String(row.description || ''),
        coverImage: String(row.coverImage || ''),
        applyBeginTime: displayTime(row.applyBeginTime),
        applyEndTime: displayTime(row.applyEndTime),
        activityBeginTime: displayTime(row.activityBeginTime),
        activityEndTime: displayTime(row.activityEndTime),
        status: String(row.status ?? '1'),
        sort: Number(row.sort || 0),
        isEnabled: Boolean(row.isEnabled),
        minPeople: Number(row.minPeople || 0),
        groupLimit: Number(row.groupLimit ?? 0),
        applyCount: Number(row.applyCount || 0),
        productCount: Number(row.productCount || 0),
        remark: String(row.remark || ''),
        createTime: displayTime(row.createTime),
        updateTime: displayTime(row.updateTime),
      }))
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
  if (activeTab.value === status) return
  activeTab.value = status
  page.current = 1
}

function search() {
  applied.keyword = filters.keyword.trim()
  applied.enabled = filters.enabled
  page.current = 1
  void refreshAll()
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
}

function openDetail(row: GroupBuyActivity) {
  detailRow.value = row
  detailVisible.value = true
}

function goAudit(row: GroupBuyActivity) {
  detailVisible.value = false
  router.push({
    path: GROUPBUY_AUDIT_PATH,
    query: { activityId: String(row.id), activityName: row.name || '' },
  })
}

function goProduct(row: GroupBuyActivity) {
  detailVisible.value = false
  router.push({
    path: GROUPBUY_PRODUCT_PATH,
    query: { activityId: String(row.id), activityName: row.name || '' },
  })
}

function goOrder(row: GroupBuyActivity) {
  detailVisible.value = false
  router.push({
    path: GROUPBUY_ORDER_PATH,
    query: { activityId: String(row.id), activityName: row.name || '' },
  })
}

function handleRowCommand(command: string, row: GroupBuyActivity) {
  if (command === 'detail') {
    openDetail(row)
  } else if (command === 'audit') {
    goAudit(row)
  } else if (command === 'product') {
    goProduct(row)
  } else if (command === 'order') {
    goOrder(row)
  } else if (command === 'delete' && row.status === '1') {
    deletingRow.value = row
    deleteVisible.value = true
  }
}

function clearEditorErrors() {
  editorErrors.name = ''
  editorErrors.description = ''
  editorErrors.sort = ''
  editorErrors.minPeople = ''
  editorErrors.groupLimit = ''
  editorErrors.applyTime = ''
  editorErrors.activityTime = ''
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
  editorForm.minPeople = 2
  editorForm.groupLimit = 0
  editorForm.sort = 1
  editorForm.remark = ''
}

function revokeLocalCover() {
  if (localCoverUrl.value) {
    URL.revokeObjectURL(localCoverUrl.value)
    localCoverUrl.value = ''
  }
}

function openCreate() {
  detailVisible.value = false
  revokeLocalCover()
  clearEditorErrors()
  editorId.value = ''
  resetEditorForm()
  editorVisible.value = true
}

function openEditor(row: GroupBuyActivity) {
  detailVisible.value = false
  revokeLocalCover()
  clearEditorErrors()
  editorId.value = row.id
  editorForm.name = row.name || ''
  editorForm.description = row.description || ''
  editorForm.coverImage = row.coverImage || ''
  editorForm.applyBeginTime = displayTime(row.applyBeginTime)
  editorForm.applyEndTime = displayTime(row.applyEndTime)
  editorForm.activityBeginTime = displayTime(row.activityBeginTime)
  editorForm.activityEndTime = displayTime(row.activityEndTime)
  editorForm.minPeople = Number(row.minPeople) || 2
  editorForm.groupLimit = Number(row.groupLimit ?? 0)
  editorForm.sort = Number(row.sort) || 1
  editorForm.remark = row.remark || ''
  editorVisible.value = true
}

function handleTimeChange() {
  editorErrors.applyTime = ''
  editorErrors.activityTime = ''
}

function handleEditorClosed() {
  revokeLocalCover()
  clearEditorErrors()
}

function handleGroupLimitInput(value: number | null | undefined) {
  editorForm.groupLimit = value ?? 0
  clearEditorError('groupLimit')
}

function handleLimitToggle(value: boolean | string | number) {
  editorForm.groupLimit = value === true ? -1 : 1
  clearEditorError('groupLimit')
}

function validateEditor() {
  clearEditorErrors()
  if (!editorForm.name.trim()) editorErrors.name = '请输入活动名称'
  if (!editorForm.description.trim()) editorErrors.description = '请输入活动描述'
  if (!editorForm.sort || Number(editorForm.sort) < 1) editorErrors.sort = '排序需大于等于 1'
  if (!editorForm.minPeople || Number(editorForm.minPeople) < 2) editorErrors.minPeople = '成团人数需大于等于 2 人'
  if (editorForm.groupLimit === null || editorForm.groupLimit === undefined || Number(editorForm.groupLimit) === 0) {
    editorErrors.groupLimit = '请设置最大开团数，或勾选不限'
  } else if (Number(editorForm.groupLimit) < -1) {
    editorErrors.groupLimit = '最大开团数需为正整数或 -1（不限）'
  }

  const applyBegin = displayTime(editorForm.applyBeginTime)
  const applyEnd = displayTime(editorForm.applyEndTime)
  const activityBegin = displayTime(editorForm.activityBeginTime)
  const activityEnd = displayTime(editorForm.activityEndTime)

  if (!applyBegin || !applyEnd) {
    editorErrors.applyTime = '请选择完整的报名开始和结束时间'
  } else if (applyBegin > applyEnd) {
    editorErrors.applyTime = '报名开始时间需早于或等于结束时间'
  }
  if (!activityBegin || !activityEnd) {
    editorErrors.activityTime = '请选择完整的活动开始和结束时间'
  } else if (activityBegin > activityEnd) {
    editorErrors.activityTime = '活动开始时间需早于或等于结束时间'
  }

  return !Object.values(editorErrors).some(Boolean)
}

async function saveEditor() {
  if (coverUploading.value) {
    ElMessage.warning('封面正在上传，请稍候')
    return
  }
  if (!validateEditor() || !editorForm.sort || !editorForm.minPeople || editorForm.groupLimit === null) {
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
    minPeople: Number(editorForm.minPeople),
    groupLimit: Number(editorForm.groupLimit),
    sort: Number(editorForm.sort),
    remark: editorForm.remark.trim(),
  }

  editorSaving.value = true
  try {
    if (editorId.value) {
      await updateGroupBuyActivity({ ...payload, id: editorId.value })
      ElMessage.success('活动信息已保存')
    } else {
      await createGroupBuyActivity(payload)
      activeTab.value = 'all'
      page.current = 1
      ElMessage.success('活动已创建，完善规则后即可发布')
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
    const response = await uploadStorageFile({
      file: options.file,
      isPublic: true,
      isUsed: false,
    }) as { data: { fileKey: string } }
    editorForm.coverImage = response.data.fileKey
    options.onSuccess(response.data)
    ElMessage.success('封面上传成功')
  } catch (error) {
    revokeLocalCover()
    options.onError(error as Parameters<typeof options.onError>[0])
  } finally {
    coverUploading.value = false
  }
}

async function toggleEnabled(row: GroupBuyActivity) {
  const nextEnabled = row.isEnabled
  toggleLoadingId.value = row.id
  try {
    await updateGroupBuyActivityEnabled({ id: row.id, isEnabled: nextEnabled })
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

function openTransition(row: GroupBuyActivity) {
  const meta = groupbuyStatusMeta(row.status)
  if (!meta.action) return
  transition.row = { ...row }
  transition.meta = meta
  transition.visible = true
}

function goEditFromTransition() {
  const row = transition.row
  if (!row) return
  transition.visible = false
  openEditor(row)
}

async function confirmTransition() {
  if (!transition.row || !transition.meta || transitionChecks.value.fail) return
  const rowId = transition.row.id
  const nextStatus = transition.meta.next
  const action = transition.meta.action
  transitionSaving.value = true
  try {
    await updateGroupBuyActivityStatus({ id: rowId, status: nextStatus })
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
  if (!deletingRow.value) return
  const rowId = deletingRow.value.id
  deleteSaving.value = true
  try {
    await deleteGroupBuyActivity([rowId])
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

.gb-operations :deep(.el-dropdown) {
  margin-left: 0;
}

.gb-more-btn {
  color: var(--ym-muted);
}

.gb-more-icon {
  margin-left: 2px;
}

.sk-when-cell {
  font-size: 12px;
}
</style>