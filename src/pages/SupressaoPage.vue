<template>
  <q-page class="page-shell">
    <div class="page-shell__inner">
      <header class="page-header">
        <div class="page-header__eyebrow">
          <q-icon name="park" size="14px" />
          Formulário operacional
        </div>
        <h1 class="page-header__title">Supressão Vegetal</h1>
        <p class="page-header__subtitle">
          Preencha os dados e anexe as evidências fotográficas de cada etapa.
        </p>
      </header>

      <!-- ── Abas ─────────────────────────────────────────────────────────── -->
      <div class="supressao-tabs q-mb-md">
        <button
          type="button"
          class="supressao-tab"
          :class="{ 'supressao-tab--active': aba === 'sem' }"
          @click="aba = 'sem'"
        >
          <q-icon name="eco" size="16px" class="q-mr-xs" />
          RELATÓRIO SEM SUPRESSÃO
        </button>
        <button
          type="button"
          class="supressao-tab"
          :class="{ 'supressao-tab--active': aba === 'com' }"
          @click="aba = 'com'"
        >
          <q-icon name="park" size="16px" class="q-mr-xs" />
          RELATÓRIO COM SUPRESSÃO
        </button>
      </div>

      <!-- ── Barra de ações ─────────────────────────────────────────────── -->
      <div class="action-bar action-bar--top q-mb-md">
        <div class="action-bar__actions action-bar__actions--end">
          <q-btn
            outline
            color="negative"
            icon="restart_alt"
            label="LIMPAR"
            no-caps
            @click="handleReset"
          />
          <q-btn
            unelevated
            icon="picture_as_pdf"
            label="Exportar PDF"
            class="action-btn--pdf"
            no-caps
            @click="handleExport"
          />
        </div>
      </div>

      <!-- ── Cabeçalho ───────────────────────────────────────────────────── -->
      <q-card flat class="premium-card q-mb-md">
        <div class="premium-card__header">
          <div class="premium-card__header-title">
            <div class="premium-card__header-icon">
              <q-icon name="info" size="22px" />
            </div>
            Dados do Relatório
          </div>
        </div>
        <q-card-section class="premium-card__body">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                :model-value="EMPRESA_FIXO"
                label="Empresa Executora"
                outlined dense readonly filled hide-bottom-space
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.responsavel"
                label="Responsável pela Validação *"
                outlined dense hide-bottom-space
                :error="validacaoAtiva && !form.responsavel.trim()"
                error-message="Informe o responsável"
              />
            </div>
            <div class="col-12 col-md-3">
              <q-input
                :model-value="REGIONAL_FIXO"
                label="Regional"
                outlined dense readonly filled hide-bottom-space
              />
            </div>
            <div class="col-12 col-md-5">
              <q-select
                v-model="form.municipio"
                :options="municipioOptionsFiltered"
                label="Município *"
                outlined dense hide-bottom-space clearable
                use-input fill-input hide-selected input-debounce="0"
                :error="validacaoAtiva && !form.municipio.trim()"
                error-message="Informe o município"
                @filter="filterMunicipios"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                v-model="form.notaProjeto"
                label="Nota do Projeto *"
                outlined dense hide-bottom-space
                :error="validacaoAtiva && !form.notaProjeto.trim()"
                error-message="Informe a nota do projeto"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                v-model="form.data"
                label="Data *"
                outlined dense hide-bottom-space
                mask="##/##/####"
                placeholder="DD/MM/AAAA"
                :error="validacaoAtiva && !form.data.trim()"
                error-message="Informe a data"
              >
                <template #append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="form.data" mask="DD/MM/YYYY">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Fechar" color="primary" flat no-caps />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- ── Seção 1: Ponto de Derivação ───────────────────────────────── -->
      <q-card flat class="premium-card q-mb-md">
        <div class="premium-card__header supressao-section-header">
          <div class="premium-card__header-title">
            <div class="premium-card__header-icon">
              <q-icon name="place" size="22px" />
            </div>
            FOTOS DO PONTO DE DERIVAÇÃO
            <span class="fotos-badge">{{ contarFotos(form.fotosDerivacao) }}/{{ maxFotos.derivacao }}</span>
          </div>
        </div>
        <q-card-section class="premium-card__body">
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.latDerivacao"
                label="Latitude"
                outlined dense hide-bottom-space
                placeholder="-3,6961"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.lngDerivacao"
                label="Longitude"
                outlined dense hide-bottom-space
                placeholder="-45,07702"
              />
            </div>
          </div>
          <div class="fotos-grid fotos-grid--2col">
            <div
              v-for="i in maxFotos.derivacao"
              :key="`derivacao-${i}`"
              class="foto-slot"
            >
              <FotoZone
                :value="form.fotosDerivacao[i - 1]!"
                :index="i - 1"
                secao="derivacao"
                :selected="isSelected('derivacao', i - 1)"
                @select="selectCell('derivacao', i - 1)"
                @pick="triggerFotoInput('derivacao', i - 1)"
                @paste="handleZonePaste($event, 'derivacao', i - 1)"
                @clear="form.fotosDerivacao[i - 1] = ''"
                @dragstart="handleDragStart('derivacao', i - 1, $event)"
                @dragend="handleDragEnd"
                @dragover="handleDragOver('derivacao', i - 1, $event)"
                @drop="handleDrop('derivacao', i - 1, $event)"
              />
              <input
                :ref="(el) => setInputRef(el, 'derivacao', i - 1)"
                type="file"
                accept="image/*"
                style="display:none"
                @change="(e) => handleFileChange(e, 'derivacao', i - 1)"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- ── Seção 2: Percurso 1 ────────────────────────────────────────── -->
      <q-card flat class="premium-card q-mb-md">
        <div class="premium-card__header supressao-section-header">
          <div class="premium-card__header-title">
            <div class="premium-card__header-icon">
              <q-icon name="route" size="22px" />
            </div>
            FOTO DO PERCURSO DA OBRA — Página 2
            <span class="fotos-badge">{{ contarFotos(form.fotosPercurso1) }}/{{ maxFotos.percurso1 }}</span>
          </div>
        </div>
        <q-card-section class="premium-card__body">
          <p class="text-caption text-grey-7 q-mb-sm">
            Incluir setas e indicações do sentido por onde irá passar a rede.
          </p>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.latPercurso1"
                label="Latitude"
                outlined dense hide-bottom-space
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.lngPercurso1"
                label="Longitude"
                outlined dense hide-bottom-space
              />
            </div>
          </div>
          <div class="fotos-grid fotos-grid--3col">
            <div
              v-for="i in maxFotos.percurso1"
              :key="`percurso1-${i}`"
              class="foto-slot"
            >
              <FotoZone
                :value="form.fotosPercurso1[i - 1]!"
                :index="i - 1"
                secao="percurso1"
                :selected="isSelected('percurso1', i - 1)"
                @select="selectCell('percurso1', i - 1)"
                @pick="triggerFotoInput('percurso1', i - 1)"
                @paste="handleZonePaste($event, 'percurso1', i - 1)"
                @clear="form.fotosPercurso1[i - 1] = ''"
                @dragstart="handleDragStart('percurso1', i - 1, $event)"
                @dragend="handleDragEnd"
                @dragover="handleDragOver('percurso1', i - 1, $event)"
                @drop="handleDrop('percurso1', i - 1, $event)"
              />
              <input
                :ref="(el) => setInputRef(el, 'percurso1', i - 1)"
                type="file"
                accept="image/*"
                style="display:none"
                @change="(e) => handleFileChange(e, 'percurso1', i - 1)"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- ── Seção 3: Percurso 2 ────────────────────────────────────────── -->
      <q-card flat class="premium-card q-mb-md">
        <div class="premium-card__header supressao-section-header">
          <div class="premium-card__header-title">
            <div class="premium-card__header-icon">
              <q-icon name="route" size="22px" />
            </div>
            FOTO DO PERCURSO DA OBRA — Página 3
            <span class="fotos-badge">{{ contarFotos(form.fotosPercurso2) }}/{{ maxFotos.percurso2 }}</span>
          </div>
        </div>
        <q-card-section class="premium-card__body">
          <p class="text-caption text-grey-7 q-mb-sm">
            Incluir setas e indicações do sentido por onde irá passar a rede.
          </p>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.latPercurso2"
                label="Latitude"
                outlined dense hide-bottom-space
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.lngPercurso2"
                label="Longitude"
                outlined dense hide-bottom-space
              />
            </div>
          </div>
          <div class="fotos-grid fotos-grid--3col">
            <div
              v-for="i in maxFotos.percurso2"
              :key="`percurso2-${i}`"
              class="foto-slot"
            >
              <FotoZone
                :value="form.fotosPercurso2[i - 1]!"
                :index="i - 1"
                secao="percurso2"
                :selected="isSelected('percurso2', i - 1)"
                @select="selectCell('percurso2', i - 1)"
                @pick="triggerFotoInput('percurso2', i - 1)"
                @paste="handleZonePaste($event, 'percurso2', i - 1)"
                @clear="form.fotosPercurso2[i - 1] = ''"
                @dragstart="handleDragStart('percurso2', i - 1, $event)"
                @dragend="handleDragEnd"
                @dragover="handleDragOver('percurso2', i - 1, $event)"
                @drop="handleDrop('percurso2', i - 1, $event)"
              />
              <input
                :ref="(el) => setInputRef(el, 'percurso2', i - 1)"
                type="file"
                accept="image/*"
                style="display:none"
                @change="(e) => handleFileChange(e, 'percurso2', i - 1)"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- ── Seção 4: Ponto Final ───────────────────────────────────────── -->
      <q-card flat class="premium-card q-mb-lg">
        <div class="premium-card__header supressao-section-header">
          <div class="premium-card__header-title">
            <div class="premium-card__header-icon">
              <q-icon name="flag" size="22px" />
            </div>
            FOTO DO PONTO FINAL DA OBRA
            <span class="fotos-badge">{{ contarFotos(form.fotosFinal) }}/{{ maxFotos.final }}</span>
          </div>
        </div>
        <q-card-section class="premium-card__body">
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.latFinal"
                label="Latitude"
                outlined dense hide-bottom-space
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.lngFinal"
                label="Longitude"
                outlined dense hide-bottom-space
              />
            </div>
          </div>
          <div class="fotos-grid" :class="finalGridClass">
            <div
              v-for="i in maxFotos.final"
              :key="`final-${i}`"
              class="foto-slot"
            >
              <FotoZone
                :value="form.fotosFinal[i - 1]!"
                :index="i - 1"
                secao="final"
                :selected="isSelected('final', i - 1)"
                @select="selectCell('final', i - 1)"
                @pick="triggerFotoInput('final', i - 1)"
                @paste="handleZonePaste($event, 'final', i - 1)"
                @clear="form.fotosFinal[i - 1] = ''"
                @dragstart="handleDragStart('final', i - 1, $event)"
                @dragend="handleDragEnd"
                @dragover="handleDragOver('final', i - 1, $event)"
                @drop="handleDrop('final', i - 1, $event)"
              />
              <input
                :ref="(el) => setInputRef(el, 'final', i - 1)"
                type="file"
                accept="image/*"
                style="display:none"
                @change="(e) => handleFileChange(e, 'final', i - 1)"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import {
  ref, computed, watch,
  onMounted, onUnmounted,
  h, resolveComponent,
} from 'vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { useSupressaoSemStore, useSupressaoComStore, SUPRESSAO_MAX_FOTOS } from 'src/stores/supressao';
import { exportSupressaoToPdf } from 'src/utils/supressao-pdf';
import { EMPRESA_FIXO, REGIONAL_FIXO, countFotos } from 'src/utils/supressao-helpers';
import municipiosMaranhaoData from 'src/data/municipios-maranhao.json';

void REGIONAL_FIXO; // usado no template

// ── Aba ativa ────────────────────────────────────────────────────────────────
const aba = ref<'sem' | 'com'>('sem');

const semStore = useSupressaoSemStore();
const comStore = useSupressaoComStore();

const activeStore = computed(() => (aba.value === 'sem' ? semStore : comStore));
const form = computed(() => activeStore.value.form);
const maxFotos = computed(() => SUPRESSAO_MAX_FOTOS[aba.value]);
const finalGridClass = computed(() => (aba.value === 'sem' ? 'fotos-grid--2col' : 'fotos-grid--3col'));

// Alias helpers
const contarFotos = countFotos;

// ── Municípios ────────────────────────────────────────────────────────────────
const municipioOptions = municipiosMaranhaoData as string[];
const municipioOptionsFiltered = ref(municipioOptions);

function normalizeSearch(v: string) {
  return v.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function filterMunicipios(
  val: string,
  update: (fn: () => void) => void,
) {
  update(() => {
    const needle = normalizeSearch(val);
    municipioOptionsFiltered.value = needle === ''
      ? municipioOptions
      : municipioOptions.filter((m) => normalizeSearch(m).includes(needle));
  });
}

// ── Validação ─────────────────────────────────────────────────────────────────
const validacaoAtiva = ref(false);
watch(aba, () => { validacaoAtiva.value = false; });

// ── Seleção de célula de foto ─────────────────────────────────────────────────
type Secao = 'derivacao' | 'percurso1' | 'percurso2' | 'final';
interface CellKey { secao: Secao; idx: number }

const selectedKey = ref<CellKey | null>(null);
const dragSrc = ref<CellKey | null>(null);
const dropTarget = ref<CellKey | null>(null);

function isSelected(secao: Secao, idx: number) {
  return selectedKey.value?.secao === secao && selectedKey.value?.idx === idx;
}

function selectCell(secao: Secao, idx: number) {
  selectedKey.value = { secao, idx };
}

// ── Acesso à array de fotos ───────────────────────────────────────────────────
function getFotosArray(secao: Secao): string[] {
  const f = form.value;
  switch (secao) {
    case 'derivacao': return f.fotosDerivacao;
    case 'percurso1': return f.fotosPercurso1;
    case 'percurso2': return f.fotosPercurso2;
    case 'final':     return f.fotosFinal;
  }
}

function setFoto(secao: Secao, idx: number, v: string) {
  getFotosArray(secao)[idx] = v;
}
function getFoto(secao: Secao, idx: number): string {
  return getFotosArray(secao)[idx] ?? '';
}

// ── File inputs ───────────────────────────────────────────────────────────────
const inputRefs: Record<string, HTMLInputElement | null> = {};
function setInputRef(el: unknown, secao: Secao, idx: number) {
  inputRefs[`${secao}-${idx}`] = el as HTMLInputElement | null;
}
function triggerFotoInput(secao: Secao, idx: number) {
  inputRefs[`${secao}-${idx}`]?.click();
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = (e) => resolve(e.target?.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function handleFileChange(event: Event, secao: Secao, idx: number) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  void readFile(file).then((v) => setFoto(secao, idx, v));
  (event.target as HTMLInputElement).value = '';
}

// ── Paste ─────────────────────────────────────────────────────────────────────
async function handleZonePaste(event: Event, secao: Secao, idx: number) {
  const ce = event as ClipboardEvent;
  const items = ce.clipboardData?.items;
  if (!items) return;
  for (const item of Array.from(items)) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (!file) continue;
      ce.preventDefault();
      try {
        setFoto(secao, idx, await readFile(file));
        selectedKey.value = { secao, idx };
        $q.notify({ type: 'positive', message: 'Imagem colada com sucesso.' });
      } catch {
        $q.notify({ type: 'negative', message: 'Erro ao colar imagem.' });
      }
      return;
    }
  }
}

async function handleGlobalPaste(event: ClipboardEvent) {
  if (document.activeElement?.closest('.foto-zone')) return;
  const items = event.clipboardData?.items;
  if (!items) return;
  for (const item of Array.from(items)) {
    if (!item.type.startsWith('image/')) continue;
    const file = item.getAsFile();
    if (!file) continue;

    // Usa a célula selecionada ou a primeira vazia
    let target: CellKey | null = selectedKey.value;
    if (!target) {
      outer: for (const sec of ['derivacao', 'percurso1', 'percurso2', 'final'] as Secao[]) {
        const arr = getFotosArray(sec);
        for (let i = 0; i < arr.length; i++) {
          if (!arr[i]) { target = { secao: sec, idx: i }; break outer; }
        }
      }
    }
    if (!target) {
      $q.notify({ type: 'warning', message: 'Selecione uma célula ou libere espaço.' });
      return;
    }
    try {
      setFoto(target.secao, target.idx, await readFile(file));
      selectedKey.value = target;
      $q.notify({ type: 'positive', message: 'Imagem colada com sucesso.' });
    } catch {
      $q.notify({ type: 'negative', message: 'Erro ao colar imagem.' });
    }
    return;
  }
}

// ── Drag & drop ───────────────────────────────────────────────────────────────
function handleDragStart(secao: Secao, idx: number, event: Event) {
  const de = event as DragEvent;
  dragSrc.value = { secao, idx };
  de.dataTransfer?.setData('text/plain', '');
}
function handleDragEnd() {
  dragSrc.value = null;
  dropTarget.value = null;
}
function handleDragOver(secao: Secao, idx: number, event: Event) {
  const de = event as DragEvent;
  de.preventDefault();
  dropTarget.value = { secao, idx };
}
function handleDrop(secao: Secao, idx: number, event: Event) {
  const de = event as DragEvent;
  de.preventDefault();
  if (dragSrc.value) {
    const src = dragSrc.value;
    if (src.secao === secao && src.idx === idx) { handleDragEnd(); return; }
    const srcVal = getFoto(src.secao, src.idx);
    const dstVal = getFoto(secao, idx);
    setFoto(src.secao, src.idx, dstVal);
    setFoto(secao, idx, srcVal);
    handleDragEnd();
    return;
  }
  // Drop de arquivo externo
  const file = de.dataTransfer?.files?.[0];
  if (file?.type.startsWith('image/')) {
    void readFile(file).then((v) => setFoto(secao, idx, v));
  }
  handleDragEnd();
}

// ── Componente FotoZone (inline) ──────────────────────────────────────────────
const FotoZone = (
  props: {
    value: string;
    index: number;
    secao: string;
    selected: boolean;
  },
  { emit }: { emit: (e: string, ...args: unknown[]) => void },
) => {
  const QBtn = resolveComponent('QBtn');
  const QIcon = resolveComponent('QIcon');

  const cls = [
    'foto-zone',
    props.value
      ? 'foto-zone--filled relative-position'
      : 'foto-zone--empty flex flex-center column',
    props.selected ? 'foto-zone--selected' : '',
  ];

  const baseAttrs = {
    class: cls,
    tabindex: '0',
    onClick: (e: Event) => emit('select', e),
    onPaste: (e: Event) => emit('paste', e),
    onDragover: (e: Event) => emit('dragover', e),
    onDrop: (e: Event) => emit('drop', e),
  };

  if (props.value) {
    return h('div', {
      ...baseAttrs,
      title: 'Arraste para outro slot ou cole com Ctrl+V',
    }, [
      h('img', {
        src: props.value,
        draggable: 'true',
        class: 'foto-img',
        onDragstart: (e: Event) => emit('dragstart', e),
        onDragend: () => emit('dragend'),
      }),
      h(QBtn, {
        icon: 'close',
        round: true,
        dense: true,
        size: 'sm',
        color: 'negative',
        class: 'absolute-top-right q-ma-xs',
        onClick: (e: MouseEvent) => { e.stopPropagation(); emit('clear'); },
      }),
    ]);
  }

  return h('div', {
    ...baseAttrs,
    title: 'Selecione, cole (Ctrl+V) ou arraste uma imagem',
  }, [
    h('button', {
      type: 'button',
      class: 'foto-zone__trigger',
      'aria-label': 'Anexar imagem',
      onClick: (e: MouseEvent) => { e.stopPropagation(); emit('pick'); },
    }, [
      h(QIcon, { name: 'add_photo_alternate', size: '36px', color: 'grey-5' }),
      h('span', { class: 'text-grey-6 text-caption q-mt-xs' }, 'Clique para anexar'),
    ]),
    h('span', { class: 'foto-zone__hint text-grey-5 text-caption' }, 'ou cole / arraste'),
  ]);
};

// ── Ações ─────────────────────────────────────────────────────────────────────
const $q = useQuasar();

function handleReset() {
  $q.dialog({
    title: 'Limpar formulário',
    message: `Deseja apagar todos os dados do relatório ${aba.value === 'sem' ? 'SEM' : 'COM'} supressão?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    activeStore.value.resetForm();
    validacaoAtiva.value = false;
    $q.notify({ type: 'info', message: 'Formulário limpo.' });
  });
}

async function handleExport() {
  validacaoAtiva.value = true;
  const f = form.value;
  if (!f.responsavel.trim() || !f.municipio.trim() || !f.notaProjeto.trim() || !f.data.trim()) {
    $q.notify({
      type: 'negative',
      message: 'Preencha os campos obrigatórios: Responsável, Município, Nota e Data.',
    });
    return;
  }

  const dismiss = $q.notify({
    type: 'ongoing',
    message: 'Gerando PDF…',
    timeout: 0,
  });
  try {
    const fileName = await exportSupressaoToPdf(f, aba.value);
    dismiss();
    $q.notify({
      type: 'positive',
      message: 'PDF gerado com sucesso.',
      caption: fileName,
      timeout: 5000,
    });
  } catch (err) {
    dismiss();
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Erro ao gerar PDF.',
    });
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => document.addEventListener('paste', handleGlobalPaste));
onUnmounted(() => document.removeEventListener('paste', handleGlobalPaste));

// Desestrutura para uso nos storeToRefs — mantém reatividade
const { form: semForm } = storeToRefs(semStore);
const { form: comForm } = storeToRefs(comStore);
void semForm; void comForm; // evita tree-shake
</script>

<style scoped lang="scss">
// ── Abas ──────────────────────────────────────────────────────────────────────
.supressao-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.supressao-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 8px;
  border: 1.5px solid var(--border);
  background: transparent;
  color: var(--text-secondary);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  letter-spacing: 0.03em;

  &:hover {
    border-color: var(--primary);
    color: var(--text-primary);
  }

  &--active {
    background: var(--primary);
    border-color: var(--primary);
    color: #fff;
  }
}

// ── Cabeçalho das seções ──────────────────────────────────────────────────────
.supressao-section-header .premium-card__header-title {
  gap: 10px;
}

.fotos-badge {
  margin-left: auto;
  font-size: 12px;
  font-weight: 700;
  color: var(--primary);
  background: color-mix(in srgb, var(--primary) 12%, transparent);
  border-radius: 99px;
  padding: 2px 10px;
}

// ── Grid de fotos ─────────────────────────────────────────────────────────────
.fotos-grid {
  display: grid;
  gap: 12px;

  &--2col { grid-template-columns: repeat(2, 1fr); }
  &--3col { grid-template-columns: repeat(3, 1fr); }

  @media (max-width: 600px) {
    &--2col,
    &--3col { grid-template-columns: 1fr 1fr; }
  }
}

.foto-slot {
  position: relative;
}

// ── Zona de foto ──────────────────────────────────────────────────────────────
:deep(.foto-zone) {
  width: 100%;
  min-height: 160px;
  border-radius: 8px;
  border: 2px dashed var(--border);
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

:deep(.foto-zone--empty) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  gap: 4px;
  background: var(--surface);
}

:deep(.foto-zone--empty:hover) {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 5%, var(--surface));
}

:deep(.foto-zone--filled) {
  border-style: solid;
  border-color: var(--primary);
}

:deep(.foto-zone--selected) {
  border-color: var(--primary) !important;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 30%, transparent);
}

:deep(.foto-zone:focus-visible) {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

:deep(.foto-img) {
  width: 100%;
  height: 160px;
  object-fit: cover;
  display: block;
}

:deep(.foto-zone__trigger) {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: inherit;
  gap: 4px;
}

:deep(.foto-zone__hint) {
  pointer-events: none;
  text-align: center;
}
</style>
