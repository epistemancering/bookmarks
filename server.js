let sequelize = require("sequelize")
let express = require("express")
let bcryptjs = require("bcryptjs")
let database = new sequelize(require("./secrets").key, {
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
api.post("/usersFind", async function(request, response) {
    response.send(await users.findAll({ attributes: ["name", "description"] }))
})
api.post("/itemsFind", async function(request, response) {
    response.send(await items.findAll({
        where: { user: request.body.user }
    }))
})
api.post("/usersCreate", function(request, response) {
    response.sendStatus(200)
    request.body.password = bcryptjs.hashSync(request.body.password)
    users.create(request.body)
})
api.post("/passwordFind", async function(request, response) {
    response.send(bcryptjs.compareSync(request.body.password, (await users.findAll({
        where: { name: request.body.user }
    }))[0].dataValues.password))
})
api.post("/create", function(request, response) {
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
api.use(express.static(__dirname + "/build"))
api.use(function(request, response) {
    response.sendFile(__dirname + "/build/")
})
database.sync().then(function() {
    api.listen(3000)
})