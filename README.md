# Port de Plaisance Russell – API privée

Russel est une application web de gestion des réservations de catways pour le port de plaisance de Russell. Cette API privée permet à la capitainerie de gérer efficacement les appontements et les réservations des bateaux.



##  Objectif

Fournir une API privée pour gérer :
- Les catways (création, lecture, mise à jour de l'état, suppression),
- Les réservations imbriquées dans un catway avec gestion des chevauchements,
- Les utilisateurs avec authentification (login / JWT),
- Une interface frontend minimale : page d'accueil / connexion, tableau de bord, listes et détails.



##  Qu’est-ce que la documentation API ?

La documentation de l’API est un guide destiné aux développeurs expliquant comment utiliser les endpoints disponibles :  
- Quels points de terminaison existent, avec quelles méthodes HTTP,  
- Les corps attendus (exemples de requêtes),  
- Les réponses retournées,  
- L’authentification requise.  

Elle inclut des exemples concrets (curl / Postman), les règles de validation , et explique pourquoi et quand appeler chaque route.



##  Prérequis

- Node.js (v18+ recommandé)  
- MongoDB (local ou distant, accessible via URI)  
- npm  

## Technologies utilisées

- Node.js 
- Express.js 
- MongoDB 
