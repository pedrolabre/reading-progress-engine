# 📖 Reading Progress Engine

> **Your reading history belongs to you. Store it as structured data.**

---

## O que é isso?

Reading Progress Engine não é um app de leitura. Não é uma rede social. Não é um gamificador.

É um **sistema de dados estruturados** para transformar o hábito de leitura em um histórico pesquisável, versionável e pessoal — armazenado inteiramente como arquivos JSON em um repositório GitHub que **você** controla.

Sem banco de dados. Sem contas. Sem APIs obrigatórias. Apenas dados estruturados, versionados pelo Git.

---

## Por que existe?

Esse projeto nasceu de uma necessidade pessoal: **a preocupação em registrar**.

Não é "eu quero ler mais". Não é "eu quero acompanhar streaks". É: *"eu quero uma forma confiável e organizada de documentar minha evolução de leitura ao longo do tempo."*

A ideia começou com um cenário simples:

> *Eu tenho um livro de 700 páginas. Já li 200. O capítulo começa na página 203. Quero registrar meu progresso — não só quantas páginas li, mas a minha evolução pelo livro, capítulo por capítulo, sessão por sessão.*

A partir disso, uma visão mais ampla surgiu:

- E se, daqui a um ano, eu pudesse consultar: *"todos os livros de fantasia que li em 2026"*?
- E se pudesse ver: *"quantas páginas li em março"*?
- E se pudesse filtrar: *"livros pausados"*, *"autores mais lidos"*, *"séries concluídas"*?
- E tudo isso **sem banco de dados** — apenas lendo arquivos JSON?

É isso que o Reading Progress Engine é.

---

## Como funciona?

### Camada de dados

Os dados de leitura são organizados como arquivos JSON dentro do repositório:

| Conceito | Descrição |
|---|---|
| **Book** | Metadados de um livro — título, autor, total de páginas, categoria, gêneros |
| **Strike** | Uma sessão de leitura — data, páginas lidas, capítulo, notas |
| **Category** | Sistema de classificação para organizar a biblioteca |
| **Library** | Visão agregada de todos os livros registrados |

<details>
<summary><strong>Exemplo mínimo (campos obrigatórios)</strong></summary>

```json
{
  "title": "Dune",
  "author": "Frank Herbert",
  "totalPages": 412,
  "currentPage": 0,
  "status": "to-read",
  "category": "science-fiction"
}
```

</details>

<details>
<summary><strong>Exemplo completo (todos os campos)</strong></summary>

```json
{
  "title": "The Way of Kings",
  "author": "Brandon Sanderson",
  "totalPages": 1007,
  "currentPage": 203,
  "status": "reading",
  "category": "fantasy",
  "genres": ["epic-fantasy", "fiction"],
  "language": "en",
  "startDate": "2026-02-10",
  "endDate": null,
  "isbn": "978-0-7653-2635-5",
  "publisher": "Tor Books",
  "year": 2010,
  "notes": "Comecei nas férias. Capítulo 1 começa na página 1, Parte 2 na página 203.",
  "tags": ["favorites", "series-cosmere"],
  "coverUrl": null
}
```

</details>

<details>
<summary><strong>Exemplo mínimo de Strike (campos obrigatórios)</strong></summary>

```json
{
  "book": "dune",
  "date": "2026-03-16",
  "startPage": 100,
  "endPage": 120,
  "pagesRead": 20
}
```

</details>

<details>
<summary><strong>Exemplo completo de Strike (todos os campos)</strong></summary>

```json
{
  "book": "the-way-of-kings",
  "date": "2026-03-15",
  "startPage": 203,
  "endPage": 245,
  "pagesRead": 42,
  "chapter": "Chapter 12 - Unity",
  "duration": 65,
  "notes": "Capítulo intenso. A visão do Dalinar foi inesperada."
}
```

</details>

### Aplicação web

A aplicação tem dois propósitos:

1. **Geração de dados** — Formulários que produzem arquivos JSON válidos, com o nome correto, caminho e estrutura. Você preenche o formulário, o app gera o arquivo, e você faz o commit manualmente.

2. **Visualização de dados** — O app lê todos os arquivos JSON do repositório e constrói uma biblioteca visual interativa. Ordenação, filtros e exploração são responsabilidade da aplicação — não ficam armazenados nos arquivos de dados.

### O commit é manual

Isso é intencional. A aplicação web **não** faz push no GitHub. Ela gera arquivos. Você faz o commit. Isso mantém o fluxo simples, transparente e sob seu controle.

---

## Estrutura do Projeto

```
reading-progress-engine/
|-- README.md
|-- data/
|   |-- books/
|   |-- categories/
|   |-- strikes/
|   `-- library.json
|-- examples/
|-- schemas/
|-- scripts/
`-- web/
    |-- index.html
    |-- package.json
    |-- package-lock.json
    `-- src/
        |-- App.jsx
        |-- components/
        |   |-- BookCard.jsx
        |   |-- BookDetail.jsx
        |   |-- BookTimeline.jsx
        |   |-- CopyButton.jsx
        |   |-- DownloadButton.jsx
        |   |-- FileInfo.jsx
        |   |-- JsonPreview.jsx
        |   |-- LibraryFilterControls.jsx
        |   |-- LibraryGrid.jsx
        |   `-- LibrarySortControls.jsx
        |-- pages/
        |   |-- BookDetailPage.jsx
        |   |-- BookFormPage.jsx
        |   |-- CategoryFormPage.jsx
        |   `-- StrikeFormPage.jsx
        |-- styles/
        `-- utils/
            |-- bookDetail.js
            |-- bookForm.js
            |-- categoryForm.js
            |-- clipboard.js
            |-- download.js
            |-- filePaths.js
            |-- jsonGenerator.js
            |-- libraryDiscovery.js
            |-- libraryFilters.js
            |-- libraryLoader.js
            |-- libraryMetrics.js
            |-- librarySorting.js
            |-- slugify.js
            `-- strikeForm.js
```

> A estrutura vai crescendo junto com o código. Tudo que for adicionado aparece aqui.

---

## Decisões de design

Cada escolha técnica nesse projeto é guiada pelo problema, não por tendências:

| Decisão | Justificativa |
|---|---|
| **JSON ao invés de banco de dados** | Arquivos são legíveis por humanos, versionáveis, portáveis e não precisam de infraestrutura |
| **Desenvolvimento schema-first** | O formato dos dados é definido antes de qualquer interface — evita retrabalho |
| **Commits manuais** | Mantém o usuário no controle total; sem mágica, sem surpresas |
| **React + Vite** | Componentização, estado reativo, rotas. O build gera arquivos estáticos que rodam em qualquer lugar |
| **Nenhuma API externa obrigatória** | A funcionalidade principal funciona offline, pra sempre |
| **Ordenação/filtros no app** | Os arquivos de dados ficam limpos e reutilizáveis por qualquer ferramenta |

---

## Status

Em desenvolvimento. Definindo arquitetura e schemas antes de escrever código.
