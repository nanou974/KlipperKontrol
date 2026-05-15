```text
# /$$$$$$$   /$$$$$$   /$$$$$$        /$$  /$$$$$$    /$$  
#| $$__  $$ /$$__  $$ /$$__  $$      | $$ /$$__  $$ /$$$$  
#| $$  \ $$| $$  \__/|__/  \ $$  /$$$$$$$| $$  \ $$|_  $$  
#| $$$$$$$ | $$ /$$$$   /$$$$$/ /$$__  $$|  $$$$$$/  | $$  
#| $$__  $$| $$|_  $$  |___  $$| $$  | $$ >$$__  $$  | $$  
#| $$  \ $$| $$  \ $$ /$$  \ $$| $$  | $$| $$  \ $$  | $$  
#| $$$$$$$/|  $$$$$$/|  $$$$$$/|  $$$$$$$|  $$$$$$/ /$$$$$$
#|_______/  \______/  \______/  \_______/ \______/ |______/
#                                                         
#                                                        
#         KlipperKontrol
#      Industrial Klipper UI
```
KlipperKontrol est une application Android tactile conçue pour contrôler une imprimante 3D sous Klipper via Moonraker.

L’objectif du projet est de proposer une interface :
- minimaliste,
- ultra lisible,
- tactile,
- rapide,
- pensée pour un écran embarqué près de l’imprimante.

Contrairement à Fluidd ou Mainsail, KlipperKontrol est conçu comme un véritable panneau de contrôle industriel dédié à l’impression 3D.

---

# Fonctionnalités

## Températures temps réel
- Hotend
- Bed
- Mise à jour live via Moonraker

## Modification des températures
- Appui tactile sur la température
- Entrée numérique directe
- Envoi immédiat des commandes Klipper

## Contrôle vitesse / flow
- Sliders tactiles
- Snap magnétique à 100%
- Entrée numérique précise
- Boutons reset individuels

## Emergency Stop
- Bouton d’arrêt d’urgence dédié
- Confirmation obligatoire avant arrêt
- Retour haptique Android

## Informations impression
- Barre de progression
- Pourcentage
- Temps total estimé
- Temps restant
- Nom du fichier GCODE

## Interface responsive
Optimisée pour :
- écrans 1024x600
- tablettes Android
- écrans tactiles Raspberry Pi
- écrans KlipperScreen

---

# Technologies utilisées

- React Native
- Expo
- Moonraker API
- React Native Slider
- Expo Haptics

---

# Installation

## Cloner le projet

```bash
git clone https://github.com/USERNAME/KlipperKontrol.git
