import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface PodaServico {
  id: number;
  data: string;
  referencia: string;
  fotoInicio: string; // base64 data URL ou ''
  fotoFim: string;    // base64 data URL ou ''
}

function createEmptyServico(id: number): PodaServico {
  return { id, data: '', referencia: '', fotoInicio: '', fotoFim: '' };
}

export function servicoPreenchido(s: PodaServico): boolean {
  return !!(s.data || s.referencia || s.fotoInicio || s.fotoFim);
}

export const usePodaStore = defineStore('poda', () => {
  const servicos = ref<PodaServico[]>(
    Array.from({ length: 5 }, (_, i) => createEmptyServico(i + 1)),
  );

  function addServico() {
    servicos.value.push(createEmptyServico(servicos.value.length + 1));
  }

  function removeServico(index: number) {
    if (servicos.value.length <= 1) return;
    servicos.value.splice(index, 1);
    servicos.value.forEach((s, i) => { s.id = i + 1; });
  }

  function resetForm() {
    servicos.value = Array.from({ length: 5 }, (_, i) => createEmptyServico(i + 1));
  }

  return { servicos, addServico, removeServico, resetForm };
});
