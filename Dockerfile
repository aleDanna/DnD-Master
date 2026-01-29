FROM postgres:18
RUN apt-get update && apt-get install -y \
  build-essential git postgresql-server-dev-18 \
  && git clone https://github.com/pgvector/pgvector \
  && cd pgvector && make && make install