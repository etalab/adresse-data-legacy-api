#!/usr/bin/env node
require('dotenv').config()

const {join} = require('path')
const {createReadStream} = require('fs')
const {createGunzip} = require('zlib')
const express = require('express')
const cors = require('cors')
const {ZipFile} = require('yazl')
const pumpify = require('pumpify')
const contentDisposition = require('content-disposition')
const departements = require('@etalab/decoupage-administratif/data/departements.json').map(d => d.code)

const app = express()

const {ADRESSE_DATA_PATH} = process.env

function getFileStream(departement) {
  return pumpify(
    createReadStream(join(ADRESSE_DATA_PATH, `adresses-${departement}.csv.gz`)),
    createGunzip()
  )
}

app.use(cors())

app.get('/data/ban-v0/BAN_licence_gratuite_repartage.zip', (req, res) => {
  const zip = new ZipFile()
  departements.forEach(departement => {
    zip.addReadStream(getFileStream(departement), `BAN_licence_gratuite_repartage_${departement}.csv`)
  })
  res.set('Content-Disposition', contentDisposition('BAN_licence_gratuite_repartage.zip'))
  res.type('zip')
  zip.outputStream.pipe(res)
  zip.end()
})

app.get('/data/ban-v0/BAN_licence_gratuite_repartage_:departement.zip', (req, res) => {
  const {departement} = req.params
  const zip = new ZipFile()
  zip.addReadStream(getFileStream(departement), `BAN_licence_gratuite_repartage_${departement}.csv`)
  res.set('Content-Disposition', contentDisposition(`BAN_licence_gratuite_repartage_${departement}.zip`))
  res.type('zip')
  zip.outputStream.pipe(res)
  zip.end()
})

app.get('/data/ban/adresses/latest/csv/adresses-france.csv', (req, res) => {
  res.type('csv')
  createReadStream(join(ADRESSE_DATA_PATH, 'adresses-france.csv.gz'))
    .pipe(createGunzip())
    .pipe(res)
})

app.listen(process.env.PORT || 5000)
