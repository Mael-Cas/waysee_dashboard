# Utilise l'image officielle Nginx
FROM nginx:alpine

# Copie ton site dans le dossier Nginx
COPY . /usr/share/nginx/html

# Expose le port 80
EXPOSE 80

# Commande par défaut (Nginx démarre automatiquement)
CMD ["nginx", "-g", "daemon off;"]
