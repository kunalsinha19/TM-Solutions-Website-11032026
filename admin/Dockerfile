FROM node:20-alpine
WORKDIR /app

RUN echo "# force-rebuild-for-base-path"
COPY . .
RUN npm install
RUN npm run build

EXPOSE 8080

# Overwrite vite.config.js at startup so the correct PORT and allowedHosts
# are always used regardless of what the cached build image contains.
# vite preview only needs the preview block — plugins aren't used at serve time.
CMD ["sh", "-c", "echo 'import{defineConfig}from\"vite\";export default defineConfig({base:\"/admin\",preview:{host:true,port:parseInt(process.env.PORT)||8080,allowedHosts:true}});' > vite.config.js && npm run preview"]
