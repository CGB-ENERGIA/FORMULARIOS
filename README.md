# Relação de Consumidores Ligados na Obra

Formulário web baseado na planilha `CONSUMIDORES.xlsx`, desenvolvido com **Bun** e **Quasar**.

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

O deploy é feito automaticamente via GitHub Actions ao push na branch `main`.
Nas configurações do repositório, em **Pages**, a origem deve ser **GitHub Actions** (não a branch `main` na raiz).
