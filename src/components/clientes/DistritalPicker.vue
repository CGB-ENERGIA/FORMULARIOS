<template>
  <section class="distrital-picker">
    <div class="distrital-picker__label">
      <q-icon name="location_city" size="18px" />
      <span>Distrital</span>
    </div>

    <div class="distrital-picker__options" role="tablist" aria-label="Selecionar distrital">
      <button
        v-if="allowAll"
        type="button"
        role="tab"
        class="distrital-chip"
        :class="{ 'distrital-chip--active': modelValue === null }"
        :aria-selected="modelValue === null"
        @click="emit('update:modelValue', null)"
      >
        Todas
      </button>

      <button
        v-for="code in DISTRITAIS"
        :key="code"
        type="button"
        role="tab"
        class="distrital-chip"
        :class="{ 'distrital-chip--active': modelValue === code }"
        :aria-selected="modelValue === code"
        @click="emit('update:modelValue', code)"
      >
        {{ code }}
      </button>
    </div>

    <p v-if="hint" class="distrital-picker__hint">
      <q-icon name="info" size="14px" />
      {{ hint }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { DISTRITAIS } from 'src/utils/historico-file';
import type { DistritalCode } from 'src/utils/historico-file';

withDefaults(
  defineProps<{
    modelValue: DistritalCode | null;
    allowAll?: boolean;
    hint?: string;
  }>(),
  {
    allowAll: false,
    hint: '',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: DistritalCode | null];
}>();
</script>

<style scoped lang="scss">
.distrital-picker {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
}

.distrital-picker__label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 88px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.distrital-picker__options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
}

.distrital-chip {
  appearance: none;
  border: 1px solid var(--border);
  cursor: pointer;
  min-width: 52px;
  padding: 6px 12px;
  border-radius: 6px;
  font: inherit;
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--text-secondary);
  background: transparent;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

.distrital-chip:hover {
  border-color: color-mix(in srgb, var(--primary) 40%, var(--border));
  color: var(--text-primary);
}

.distrital-chip--active {
  color: #fff;
  border-color: var(--primary);
  background: var(--primary);
}

.distrital-chip:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.distrital-picker__hint {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
}

@media (max-width: 600px) {
  .distrital-picker {
    align-items: flex-start;
    flex-direction: column;
  }

  .distrital-chip {
    flex: 1 1 calc(33.333% - 6px);
    min-width: 0;
  }
}
</style>
