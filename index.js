require('dotenv').config()
const { ApolloServer } = require('apollo-server-express')
const typeDefs = require('graphql-import').importSchema('./schema/schema.graphql')
const { resolvers } = require('./schema/resolvers')
const loggingplugin = require('./loggingplugin')
const port = 4000
const bodyParser = require('body-parser');
const auth = require('./auth')
const passport = require('./auth/passport.js')
const cors = require('cors')

const app = require('express')()
const session = require("express-session")

var corsOption = {
  origin: true,
  credentials: true,
};

app.use(session({ secret: 'strokes', resave: true, saveUninitialized: false,
  cookie : { secure : false, maxAge : (4 * 60 * 60 * 1000) } }))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors(corsOption));
app.use(passport.initialize());
app.use(passport.session());
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})
app.use('/api', auth)

// app.use('/graphql', passport.authenticate('session', { session: true }));

const apollo = new ApolloServer({ typeDefs, resolvers, plugins: [loggingplugin],
  context: ({req}) => ({ authedUser: req.user })
})

apollo.applyMiddleware({ app, cors: false })

app.listen({ port }, _ => 
  console.log(`🚀 Server ready at http://localhost:4000${apollo.graphqlPath}`)
)
