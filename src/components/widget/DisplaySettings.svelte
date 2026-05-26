<script lang="ts">
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import {
  getDefaultHue,
  getDynamicThemeColorEnabled,
  getHue,
  isDynamicThemeColorAvailable,
  setDynamicThemeColorEnabled,
  setHue,
} from "@utils/setting-utils";

let hue = getHue();
const defaultHue = getDefaultHue();
// 动态取色是否具备可用条件（当前要求 banner.enable=true）。
const dynamicThemeColorAvailable = isDynamicThemeColorAvailable();
// 初始化时遵循“本地优先，其次配置”的最终开关值。
let dynamicThemeColorEnabled =
  dynamicThemeColorAvailable && getDynamicThemeColorEnabled();

/**
 * 处理动态取色开关切换。
 * - 当不可用时强制回退为 false；
 * - 当用户关闭动态取色时，立即恢复手动 hue 控制并应用当前滑块值。
 */
function onDynamicThemeColorToggle() {
  if (!dynamicThemeColorAvailable) {
    dynamicThemeColorEnabled = false;
    return;
  }

  setDynamicThemeColorEnabled(dynamicThemeColorEnabled);
  if (!dynamicThemeColorEnabled) {
    setHue(hue);
  }
}

/**
 * 重置 hue 为配置默认值。
 * 边界：动态取色开启时不允许手动重置，避免与自动提取冲突。
 */
function resetHue() {
  if (dynamicThemeColorEnabled) {
    return;
  }
	hue = getDefaultHue();
}

// 仅在“手动模式”下同步 hue 到 CSS 变量，避免覆盖动态提取结果。
$: if ((hue || hue === 0) && !dynamicThemeColorEnabled) {
	setHue(hue);
}
</script>

<div id="display-setting" class="float-panel float-panel-closed absolute transition-all w-80 right-4 px-4 py-4">
    <div class="flex flex-row gap-2 mb-3 items-center justify-between">
        <div class="flex gap-2 font-bold text-lg text-neutral-900 dark:text-neutral-100 transition relative ml-3
            before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)]
            before:absolute before:-left-3 before:top-[0.33rem]"
        >
            {i18n(I18nKey.themeColor)}
            <button aria-label="Reset to Default" class="btn-regular w-7 h-7 rounded-md  active:scale-90 will-change-transform"
                    class:opacity-0={hue === defaultHue} class:pointer-events-none={hue === defaultHue} on:click={resetHue}>
                <div class="text-[var(--btn-content)]">
                    <Icon icon="fa6-solid:arrow-rotate-left" class="text-[0.875rem]"></Icon>
                </div>
            </button>
        </div>
        <div class="flex gap-1">
            <div id="hueValue" class="transition bg-[var(--btn-regular-bg)] w-10 h-7 rounded-md flex justify-center
            font-bold text-sm items-center text-[var(--btn-content)]">
                {hue}
            </div>
        </div>
    </div>
      <div class="mb-3 flex items-center justify-between">
        <label for="dynamic-theme-color-switch" class="font-semibold text-[var(--btn-content)]">
          {i18n(I18nKey.dynamicThemeColor)}
        </label>
        <input
          id="dynamic-theme-color-switch"
          type="checkbox"
          bind:checked={dynamicThemeColorEnabled}
          on:change={onDynamicThemeColorToggle}
          aria-label={i18n(I18nKey.dynamicThemeColor)}
          class="h-4 w-4 cursor-pointer accent-[var(--primary)]"
          disabled={!dynamicThemeColorAvailable}
        >
      </div>
      <div class="w-full h-6 px-1 bg-[oklch(0.80_0.10_0)] dark:bg-[oklch(0.70_0.10_0)] rounded select-none"
         class:opacity-50={dynamicThemeColorEnabled}>
        <input aria-label={i18n(I18nKey.themeColor)} type="range" min="0" max="360" bind:value={hue}
             class="slider" id="colorSlider" step="5" style="width: 100%" disabled={dynamicThemeColorEnabled}>
    </div>
</div>


<style lang="stylus">
    #display-setting
      input[type="range"]
        -webkit-appearance none
        height 1.5rem
        background-image var(--color-selection-bar)
        transition background-image 0.15s ease-in-out

        /* Input Thumb */
        &::-webkit-slider-thumb
          -webkit-appearance none
          height 1rem
          width 0.5rem
          border-radius 0.125rem
          background rgba(255, 255, 255, 0.7)
          box-shadow none
          &:hover
            background rgba(255, 255, 255, 0.8)
          &:active
            background rgba(255, 255, 255, 0.6)

        &::-moz-range-thumb
          -webkit-appearance none
          height 1rem
          width 0.5rem
          border-radius 0.125rem
          border-width 0
          background rgba(255, 255, 255, 0.7)
          box-shadow none
          &:hover
            background rgba(255, 255, 255, 0.8)
          &:active
            background rgba(255, 255, 255, 0.6)

        &::-ms-thumb
          -webkit-appearance none
          height 1rem
          width 0.5rem
          border-radius 0.125rem
          background rgba(255, 255, 255, 0.7)
          box-shadow none
          &:hover
            background rgba(255, 255, 255, 0.8)
          &:active
            background rgba(255, 255, 255, 0.6)

</style>
