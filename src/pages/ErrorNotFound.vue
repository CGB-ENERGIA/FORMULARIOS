<template>
  <div class="error-page">
    <div class="error-page__card">
      <div class="error-page__code">404</div>
      <h1 class="text-h5 text-weight-bold q-mt-md q-mb-sm">Página não encontrada</h1>
      <p class="text-body2 text-grey-7 q-mb-lg">
        O endereço acessado não existe ou foi movido para outro formulário.
      </p>
      <q-btn
        unelevated
        color="primary"
        to="/"
        label="Voltar ao início"
        icon="home"
        no-caps
        padding="sm lg"
      />
    </div>
  </div>
</template>

<script setup lang="ts"></script>
