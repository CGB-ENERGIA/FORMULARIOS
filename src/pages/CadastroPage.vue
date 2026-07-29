<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
  void router.replace({ path: '/clientes', query: { tab: 'cadastro' } });
});
</script>

<template>
  <div />
</template>
