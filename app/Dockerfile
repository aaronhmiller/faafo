FROM alpine
WORKDIR /app
COPY package.json .
RUN apk add --update npm && \
    npm install
COPY . ./
EXPOSE 3000 3443
CMD ["node", "app.js"]
