<h1 align='center'>Netowrk modeling</h1>
<h3 align='center'>A prototype client-server web application for utility network modeling.</h3>

<p align="center">
  <a href="#motivation">Motivation</a> •
  <a href="#key-features">Key features</a> •
  <a href="#credits">Credits</a> •
  <a href="#how-to-use">How To Use</a>
</p>

![screenshot](https://raw.githubusercontent.com/evolext/network_modeling/master/img/network_modeling.gif)

## Motivation

The purpose of this project is to create a prototype client-server web application for utility network modeling. The application will be used to create and edit network models. The project was developed as part of the bachelor's graduation work.

### Key Features

- Drawing of utility network schemes on a map
- Modeling of water and heat supply networks (two modes)
- Calculation of unknown parameters of networks based on their models and specified data
    - Hydraulic (water supply networks)
    - Plotting piezometric diagram (water supply networks)
    - Reliability calculation (heat supply networks)
- Supports APIs of two types of maps
  - [Yandex Maps](https://yandex.ru/dev/maps/)
  - [OpenStreetMap](https://www.openstreetmap.org/)
- Saving and loading models

## Credits

- [Node.js](https://nodejs.org/en/)
- [Leaflet](https://leafletjs.com/)
    - [BigImage plugin](https://github.com/pasichnykvasyl/Leaflet.BigImage)
    - [PolylineDecorator plugin](https://github.com/bbecquet/Leaflet.PolylineDecorator)
- [jQuery](https://jquery.com/)

## How To Use

To clone and run this application, you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
$ git clone https://github.com/evolext/network_modeling

# Go into the repository
$ cd network_modeling

# Install dependencies
$ npm install

# Run the app
$ node index

# Finally open the website http://localhost:5000/ in your browser
```
