# Formulários

Plataforma de formulários digitais da CGB Engenharia, desenvolvida com **Bun** e **Quasar**.

## Formulários disponíveis

- **Consumidores Ligados na Obra** — relação baseada na planilha `CONSUMIDORES.xlsx`

## Requisitos

- [Bun](https://bun.sh/) 1.x

## Como executar

```bash
cd consumidores-web
bun install
bun run dev
```

O navegador abrirá automaticamente em `http://localhost:9000`.

## Funcionalidades

- Menu lateral com navegação entre formulários
- Preenchimento das informações da obra (descrição, fornecedor, PEP, datas, regional, etc.)
- Tabela editável de consumidores com os mesmos campos da planilha
- Adicionar e remover linhas de consumidores
- Exportar para Excel no mesmo layout da planilha original
- Gerar PDF com banner, dados da obra e tabela de consumidores
- Limpar formulário

## Build para produção

```bash
bun run build
```

Os arquivos ficam em `dist/spa`.

## Publicação (GitHub Pages)

URL: https://italoproject.github.io/consumidores-web/

O deploy publica o build na branch `gh-pages`. Em **Settings → Pages**, a origem deve ser **Deploy from branch** → branch `gh-pages` → pasta `/`.
