<template>
  <q-page class="page-shell">
    <div class="page-shell__inner">
      <header class="page-header">
        <div class="page-header__eyebrow">
          <q-icon name="power_off" size="14px" />
          Formulário operacional
        </div>
        <h1 class="page-header__title">Desligamento</h1>
        <p class="page-header__subtitle">
          Registre os consumidores desligados na obra. Em breve você poderá preencher, exportar
          para Excel e gerar PDF neste formulário.
        </p>
      </header>

      <q-card flat class="premium-card">
        <div class="premium-card__header">
          <div class="premium-card__header-title">
            <div class="premium-card__header-icon premium-card__header-icon--muted">
              <q-icon name="construction" size="22px" />
            </div>
            Formulário em desenvolvimento
          </div>
        </div>

        <q-card-section class="premium-card__body">
          <div class="placeholder-panel">
            <q-icon name="power_off" size="48px" color="primary" />
            <div class="placeholder-panel__title">DESLIGAMENTO</div>
            <p class="placeholder-panel__text">
              Esta página já está disponível no menu. Os campos e exportações serão adicionados na
              próxima etapa.
            </p>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts"></script>

<style scoped>
.placeholder-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 24px;
  text-align: center;
}

.placeholder-panel__title {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--text-primary);
}

.placeholder-panel__text {
  max-width: 420px;
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.6;
}

.premium-card__header-icon--muted {
  background: rgba(100, 116, 139, 0.12);
  color: #64748b;
}
</style>
