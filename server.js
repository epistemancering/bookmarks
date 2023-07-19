let sequelize = require("sequelize")
let express = require("express")
let jsonwebtoken = require("jsonwebtoken")
let bcryptjs = require("bcryptjs")
let keys = require("./keys")
let database = new sequelize(keys.database, {
    dialect: "postgres",
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    }
})
let users = database.define("users", { name: sequelize.DataTypes.TEXT, description: sequelize.DataTypes.TEXT, password: sequelize.DataTypes.TEXT })
let items = database.define("items", { user: sequelize.DataTypes.TEXT, index: sequelize.DataTypes.DECIMAL, parent: sequelize.DataTypes.DECIMAL, order: sequelize.DataTypes.DECIMAL, name: sequelize.DataTypes.TEXT, description: sequelize.DataTypes.TEXT, address: sequelize.DataTypes.TEXT, public: sequelize.DataTypes.BOOLEAN, shortcut: sequelize.DataTypes.DECIMAL })
let tags = database.define("tags", { name: sequelize.DataTypes.TEXT, item: sequelize.DataTypes.DECIMAL })
let shares = database.define("shares", { user: sequelize.DataTypes.TEXT, item: sequelize.DataTypes.DECIMAL })
let api = express()
api.use(express.json())
api.use(express.static(__dirname + "/build"))
api.get("*", function(request, response) {
    response.sendFile(__dirname + "/build/")
})
api.post("/find", async function(request, response) {
    response.send(await Promise.all([
        users.findAll({ attributes: ["name", "description"] }),
        items.findAll({
            where: { user: request.body.user }
        })
    ]))
})
api.post("/itemsFind", async function(request, response) {
    response.send(await items.findAll({
        where: { user: request.body.user }
    }))
})
api.post("/usersCreate", function(request, response) {
    response.send(jsonwebtoken.sign({ user: request.body.name }, keys.token))
    request.body.password = bcryptjs.hashSync(request.body.password)
    users.create(request.body)
})
api.post("/usersFind", async function(request, response) {
    if (bcryptjs.compareSync(request.body.password, (await users.findAll({
        where: { name: request.body.name }
    }))[0].dataValues.password)) {
        response.send(jsonwebtoken.sign({ user: request.body.name }, keys.token))
    } else {
        response.send()
    }
})
api.use(function(request, response, next) {
    try {
        if (jsonwebtoken.verify(request.get("token"), keys.token).user === request.body.user) {
            next()
        }
    } catch {}
})
api.post("/itemsCreate", function(request, response) {
    response.sendStatus(200)
    items.create(request.body)
})
api.put("/update", function(request, response) {
    response.sendStatus(200)
    items.update(request.body, {
        where: { user: request.body.user, index: request.body.index }
    })
})
api.put("/destroy", function(request, response) {
    response.sendStatus(200)
    items.destroy({
        where: { user: request.body.user, index: request.body.destroyed }
    })
})
database.sync().then(function() {
    api.listen(3000)
})