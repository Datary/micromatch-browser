/******************************************************************************
 * @description
 * Se limita a importar la libreria micromatch, de manera que cuando se 
 * produzca la browserificacion, esta estara disponible a traves de la variable
 * pertinentemente asignada a aquella.
 * 
 *****************************************************************************/
window.micromatch   = require('micromatch');    //preferred way
window.mm           = window.micromatch;        //alias