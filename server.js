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
let users = database.define("users", { size: sequelize.DataTypes.DOUBLE, user: sequelize.DataTypes.TEXT, description: sequelize.DataTypes.TEXT, password: sequelize.DataTypes.TEXT })
let items = database.define("items", { user: sequelize.DataTypes.TEXT, index: sequelize.DataTypes.DOUBLE, parent: sequelize.DataTypes.DOUBLE, order: sequelize.DataTypes.DOUBLE, name: sequelize.DataTypes.TEXT, description: sequelize.DataTypes.TEXT, address: sequelize.DataTypes.TEXT, public: sequelize.DataTypes.BOOLEAN, shortcut: sequelize.DataTypes.DOUBLE })
let tags = database.define("tags", { name: sequelize.DataTypes.TEXT, item: sequelize.DataTypes.DOUBLE })
let shares = database.define("shares", { user: sequelize.DataTypes.TEXT, item: sequelize.DataTypes.DOUBLE })
let user
function filter(user, index) {
    let filter = {
        where: { user: user }
    }
    if (index) {
        filter.where.index = index
    }
    return filter
}
async function authenticate(user, response, body, next) {
    if (bcryptjs.compareSync(body.password, (await users.findAll(filter(user)))[0].dataValues.password)) {
        next(user, response, body)
    } else {
        response.send()
    }
}
let api = express()
api.use(express.json())
api.use(express.static(__dirname + "/build"))
api.get("*", function(request, response) {
    response.sendFile(__dirname + "/build/")
})
api.post("/find", async function(request, response) {
    response.send(await Promise.all([
        users.findAll({ order: ["createdAt"], attributes: ["user", "description"] }),
        items.findAll(filter(request.body.user))
    ]))
})
api.post("/itemsFind", async function(request, response) {
    response.send(await items.findAll(filter(request.body.user)))
})
api.post("/create", function(request, response) {
    response.send(jsonwebtoken.sign({ user: request.body.user }, keys.token))
    request.body.password = bcryptjs.hashSync(request.body.password)
    users.create(request.body)
})
api.post("/usersFind", function(request, response) {
    authenticate(request.body.user, response, request.body, function(user, response) {
        response.send(jsonwebtoken.sign({ user: user }, keys.token))
    })
})
api.use(function(request, response, next) {
    user = request.get("user")
    try {
        if (jsonwebtoken.verify(request.get("token"), keys.token).user === user) {
            next()
        }
    } catch {}
})
api.put("/createIncrementUpdate", function(request, response) {
    response.sendStatus(200)
    if (request.body.item) {
        items.create(request.body.item)
        if (request.body.item.address) {
            users.increment("size", filter(request.body.item.user))
        }
    }
    for (let index in request.body.indices) {
        items.update({ order: request.body.orders[index] }, filter(user, request.body.indices[index]))
    }
})
api.put("/itemsUpdate", function(request, response) { // this should be combined with createUpdate
    response.sendStatus(200)
    items.update(request.body, filter(user, request.body.index))
})
api.put("/destroyIncrement", function(request, response) {
    response.sendStatus(200)
    items.destroy(filter(user, request.body.destroyed))
    users.increment({ size: request.body.reduction }, filter(user))
})
api.put("/usersUpdate", function(request, response) {
    response.sendStatus(200)
    users.update(request.body, filter(user))
})
api.put("/findUpdate", function(request, response) {
    authenticate(user, response, request.body, function(user, response, body) {
        response.sendStatus(200)
        users.update({ password: bcryptjs.hashSync(body.new) }, filter(user))
    })
})
api.put("/findDestroy", function(request, response) {
    authenticate(user, response, request.body, function(user, response) {
        response.sendStatus(200)
        users.destroy(filter(user))
        items.destroy(filter(user))
    })
})
database.sync().then(function() {
    api.listen(3000)
    users.findAll(filter("austin")).then(function(resolution) {
        console.log(resolution)
    })
    // users.update({ size: 12 }, filter("austin"))
})