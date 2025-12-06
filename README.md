# Dashboard-de-Analise-de-Sentimentos-em-Reviews-de-Jogos-usando-NLP
Aplicação full stack de classificação e análise de sentimentos em reviews de jogos: backend FastAPI, frontend React + Vite + Tailwind e modelos de NLP treinados em Notebook a partir de dataset do Kaggle. Inclui API REST para predição, dashboards interativos e análise em lote via CSV.




Aplicação full stack de análise de sentimentos em reviews de jogos, utilizando:

* Backend em **FastAPI** (Python)
* Frontend em **React + Vite + Tailwind CSS**
* Modelos de NLP treinados em **Jupyter Notebook**
* Dataset de reviews obtido no **Kaggle**

O projeto implementa um pipeline completo: do dataset bruto até uma aplicação web consumindo uma API de predição de sentimento, incluindo visualizações, análise em lote e histórico de análises.

---

## 1. Visão geral do projeto

Este repositório foi estruturado para funcionar como um "laboratório" de experimentação com NLP aplicado a reviews de jogos. Os principais objetivos são:

1. Ler e processar um dataset de reviews de jogos (Kaggle).
2. Treinar modelos de machine learning para classificação de sentimento (positivo/negativo).
3. Serializar os artefatos de modelo (vetorizador, classificador, etc.) e carregá-los em um backend.
4. Disponibilizar uma API REST organizada em rotas (jogos, reviews, predições).
5. Fornecer um frontend interativo para consumir a API, analisar reviews individuais ou em lote (CSV) e visualizar métricas agregadas.
6. Facilitar a execução do ambiente em Windows através de scripts `.bat`.

A arquitetura lógica pode ser vista como quatro camadas principais:

1. **Camada de dados**: dataset do Kaggle (pasta `dataset/`).
2. **Camada de experimentação/treino**: notebooks em `Notebook/`.
3. **Camada de serviço (API)**: código FastAPI em `app/` carregando os modelos em `models/`.
4. **Camada de apresentação**: frontend em `frontend/` (React + Vite + Tailwind).

---

## 2. Estrutura de diretórios

Estrutura geral do projeto (alguns arquivos/diretórios podem variar conforme evolução do código):

```text
.
├── .venv/                        # Ambiente virtual Python (Windows) - não versionar
├── venv/                         # Alternativa de ambiente virtual - não versionar
├── app/                          # Backend FastAPI
│   ├── database.py               # Conexão com banco de dados (se utilizado)
│   ├── main.py                   # Ponto de entrada da aplicação FastAPI
│   ├── ml.py                     # Carregamento de modelos e funções de predição
│   ├── schemas.py                # Modelos Pydantic (request/response)
│   ├── utils.py                  # Funções auxiliares
│   ├── routers/                  # Módulos de rotas da API
│   │   ├── games.py              # Endpoints relacionados a jogos
│   │   ├── predictions.py        # Endpoints de predição de sentimento
│   │   └── reviews.py            # Endpoints de reviews
│   └── __pycache__/              # Arquivos gerados pelo Python
├── dataset/                      # Arquivos de dataset (ex.: CSV de reviews)
├── frontend/                     # Frontend React + Vite + Tailwind
│   ├── src/
│   │   ├── App.tsx               # Componente raiz da aplicação
│   │   ├── main.tsx              # Ponto de entrada da aplicação React
│   │   ├── index.css             # Estilos globais + Tailwind
│   │   ├── vite-env.d.ts         # Tipagens do Vite
│   │   ├── api/
│   │   │   └── index.ts          # Cliente HTTP para a API (axios/fetch)
│   │   └── components/           # Componentes de interface
│   │       ├── AnalysisHistory.tsx
│   │       ├── GameCharts.tsx
│   │       ├── GameDashboard.tsx
│   │       ├── GameList.tsx
│   │       ├── ReviewInspector.tsx
│   │       ├── SentimentCsv.tsx
│   │       └── SentimentSingle.tsx
│   └── ...                       # Demais arquivos de configuração (vite.config, tailwind.config etc.)
├── models/                       # Modelos treinados (artefatos .pkl ou similares)
├── Notebook/                     # Jupyter Notebooks de treino e exploração
│   └── ...
├── builder.config                # Configuração de build/deploy (se aplicável)
├── requirements.txt              # Dependências Python do backend
├── starter_API.bat               # Script .bat para iniciar a API em ambiente virtual
└── README.md                     # Este arquivo
```

Observação: os diretórios `.venv/` e `venv/` são ambientes virtuais locais de desenvolvimento e não devem ser versionados (devem ser adicionados ao `.gitignore`).

---

## 3. Dataset (Kaggle)

O dataset utilizado para este projeto é originado do Kaggle, contendo reviews de jogos com, no mínimo:

* identificador do jogo
* nome do jogo
* texto da review
* rótulo de sentimento (ex.: positivo = 1, negativo = -1)
* possivelmente outras colunas, como número de votos, data, etc.

O(s) arquivo(s) correspondente(s) deve(m) ser colocado(s) na pasta `dataset/`. O notebook de treinamento assume que o caminho de leitura aponta para esse diretório.

Por questões de tamanho/licença, o dataset original pode não estar incluído diretamente no repositório público.

---

## 4. Notebook e treinamento dos modelos

A pasta `Notebook/` contém o(s) Jupyter Notebook(s) responsáveis pela etapa de experimentação e treinamento de modelos. De forma geral, o fluxo seguido é:

1. Leitura do dataset a partir da pasta `dataset/`.
2. Limpeza e pré-processamento de texto (remoção de stopwords, normalização, etc.).
3. Extração de features (por exemplo, `CountVectorizer`).
4. Treinamento do modelo de classificação (por exemplo, Naive Bayes).
5. Avaliação do modelo em conjunto de teste.
6. Serialização dos artefatos para a pasta `models/`:

   * `models/vectorizer.pkl`
   * `models/classifier.pkl`
   * outros arquivos auxiliares, se necessário.

Após a geração dos arquivos na pasta `models/`, o backend é capaz de carregá-los por meio do módulo `app/ml.py`.

---

## 5. Backend FastAPI

O backend é implementado em FastAPI, organizado em módulos e rotas específicas.

### 5.1. Principais módulos

* `app/main.py`

  * Cria a instância da aplicação FastAPI.
  * Configura o carregamento das rotas presentes em `app/routers/`.
  * Pode configurar middlewares, CORS e outras opções globais.

* `app/ml.py`

  * Responsável por carregar os arquivos de modelo da pasta `models/`.
  * Expõe funções para realizar a predição de sentimento a partir de texto.

* `app/schemas.py`

  * Define modelos Pydantic utilizados como schemas de entrada e saída da API.
  * Exemplo: estrutura do JSON de requisição para predição.

* `app/database.py` (se utilizado)

  * Lida com a conexão ao banco de dados.
  * Encapsula parâmetros de conexão, criação de cursor, etc.

* `app/utils.py`

  * Funções auxiliares (por exemplo, normalização de texto adicional, validações, etc.).

* `app/routers/games.py`

  * Endpoints relacionados a jogos (listar jogos, buscar por ID, estatísticas agregadas por jogo, etc.).

* `app/routers/predictions.py`

  * Endpoints de predição de sentimento.
  * Pode incluir rotas para predição unitária e em lote (JSON/CSV).

* `app/routers/reviews.py`

  * Endpoints relacionados a reviews (listagem, busca por sentimento, etc.).

### 5.2. Instalação das dependências

Crie e ative um ambiente virtual (caso ainda não exista):

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate
```

Instale as dependências Python listadas em `requirements.txt`:

```bash
pip install -r requirements.txt
```

### 5.3. Execução manual da API

Na raiz do projeto, com o ambiente virtual ativo:

```bash
uvicorn app.main:app --reload
```

Endereços padrão:

* API: `http://localhost:8000`
* Documentação Swagger: `http://localhost:8000/docs`
* Documentação ReDoc: `http://localhost:8000/redoc`

### 5.4. Execução da API via script `.bat`

Na raiz do projeto existe um script chamado `starter_API.bat`, pensado para ambientes Windows.

O fluxo típico de um script desse tipo é:

1. Navegar até o diretório raiz do projeto.
2. Ativar o ambiente virtual (`.venv`).
3. Executar o comando `uvicorn app.main:app --reload`.

Exemplo de conteúdo (apenas ilustrativo):

```bat
cd C:\CAMINHO\PARA\FastAPI_Projeto_Versao_2
call .venv\Scripts\activate
uvicorn app.main:app --reload
```

Ao copiar o projeto para outra máquina ou outro diretório, é necessário **ajustar os caminhos** dentro do `.bat` para refletir a nova localização da pasta do projeto e do ambiente virtual.

---

## 6. Frontend React + Vite + Tailwind

O frontend está na pasta `frontend/` e utiliza:

* React (componentes em TypeScript)
* Vite como ferramenta de build e servidor de desenvolvimento
* Tailwind CSS para estilização

### 6.1. Organização básica

* `frontend/src/main.tsx`: ponto de entrada da aplicação React.
* `frontend/src/App.tsx`: componente raiz, orquestra rotas/áreas principais.
* `frontend/src/index.css`: inclui diretivas do Tailwind e estilos globais.
* `frontend/src/api/index.ts`: abstração de chamadas HTTP para a API FastAPI.
* `frontend/src/components/`: componentes reutilizáveis e telas principais, como:

  * `GameList.tsx` / `GameDashboard.tsx`: listagem de jogos e painel principal.
  * `SentimentSingle.tsx`: análise de sentimento de uma review digitada pelo usuário.
  * `SentimentCsv.tsx`: fluxo de upload e análise de múltiplas reviews via CSV.
  * `ReviewInspector.tsx`: detalhamento de reviews específicas.
  * `AnalysisHistory.tsx`: histórico de análises já realizadas.
  * `GameCharts.tsx`: gráficos com métricas associadas aos jogos.

### 6.2. Instalação e execução

Dentro da pasta `frontend/`:

```bash
cd frontend
npm install
npm run dev
```

O Vite utilizará, por padrão, uma porta como:

* `http://localhost:5173`

A aplicação frontend deve estar configurada para consumir a API em `http://localhost:8000` (ou outra URL definida) por meio de `frontend/src/api/index.ts`.

Caso existam scripts `.bat` específicos para o frontend (por exemplo, para ativar `venv` e rodar `npm run dev`), é necessário igualmente ajustar os caminhos internos destes arquivos ao clonar o projeto para outra máquina.

---

## 7. Endpoints principais (exemplos)

A seguir, alguns endpoints típicos expostos pelo backend (a implementação exata pode variar):

### 7.1. `POST /predict`

Recebe uma review em texto e retorna o sentimento previsto.

**Request body (JSON):**

```json
{
  "review": "Texto da review aqui."
}
```

**Response (exemplo):**

```json
{
  "sentiment": 1,
  "model_name": "NaiveBayes_CountVectorizer",
  "model_version": "v1"
}
```

Onde, por convenção:

* `1` representa review positiva
* `-1` representa review negativa

### 7.2. `GET /games`

Retorna a lista de jogos presentes na base (com possíveis estatísticas agregadas, dependendo da implementação em `games.py`).

### 7.3. `GET /reviews`

Retorna reviews armazenadas no banco de dados ou na fonte de dados configurada.

### 7.4. `GET /health`

Endpoint simples de verificação da API:

```json
{
  "status": "ok"
}
```

---

## 8. Fluxo resumido de uso

1. Obter o dataset no Kaggle e colocá-lo na pasta `dataset/`.
2. Abrir o notebook em `Notebook/` e executar o fluxo de pré-processamento e treinamento.
3. Exportar os modelos treinados para a pasta `models/`.
4. Criar/ativar o ambiente virtual e instalar as dependências Python (`requirements.txt`).
5. Iniciar a API via `uvicorn` ou `starter_API.bat`.
6. Acessar `http://localhost:8000/docs` para testar os endpoints.
7. Iniciar o frontend em `frontend/` (`npm install` + `npm run dev`).
8. Acessar a interface web (por exemplo, `http://localhost:5173`) e utilizar os fluxos de análise de sentimento (review única, CSV, dashboards, etc.).

---

## 9. Considerações finais

Este repositório foi construído com foco didático e de experimentação, mas a organização em camadas (dados, notebook, modelos, API e frontend) permite sua evolução para cenários mais próximos de produção, incluindo:

* substituição ou adição de novos modelos de NLP;
* integração com bancos de dados gerenciados (cloud);
* exposição de novos endpoints analíticos;
* expansão do frontend com novos dashboards e filtros.

A estrutura e os scripts fornecidos devem servir como base para estudos em processamento de linguagem natural, desenvolvimento de APIs em FastAPI e construção de frontends modernos com React + Vite + Tailwind.
