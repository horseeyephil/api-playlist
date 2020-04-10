const { ApolloServer } = require('apollo-server')
const { PrismaClient } = require('@prisma/client')
const typeDefs = require('graphql-import').importSchema('schema.graphql')
const prisma = new PrismaClient({ log: ['query', 'info', 'warn']})

const loggingplugin = require('./loggingplugin')

const resolvers = {
  Query: {
    user(_, { username }) {
      return prisma.user.findOne({ 
        where: { username }
      })
    },
    playlist(_, { id }) {
      console.log('we here', id, typeof id)
      return prisma.playlist.findOne({ where: { id }})
    },
    playlistSearch(_, { keyword }) {
      return prisma.playlist.findMany({
        where: { title: {
          contains: keyword
        }}
      })
    },
    restaurant(_, { id }, { prisma }) {
      return prisma.restaurant.findOne({ where: { id }})
    },
    restaurantsByName(_, { name }, { prisma }) {
      return prisma.restaurants({
        where: { name: { 
          contains: name.toLowerCase()
        }}
      })
    }
  },
  Mutation: {
    addUser(_, data) {
      return prisma.user.create({ data })
    },
    createPlaylist(_, args) {
      console.log('whooo')
      return prisma.playlist.create({ data: {
        title: args.title,
        description: args.description,
        creator: { connect: { id: parseInt(args.creatorId) }},
      }})
    },
    createMemberWithRestaurant(_, args) {
      console.log('sdfdsf', args)
        const id = parseInt(args.playlistId)
        return prisma.rankedMember.create({ data: {
        ...args.rankedMember, 
        playlist: { connect: { id }},
        restaurant: { 
          create: args.restaurant
        }
      }})
    },
    addToPlaylist(_, args) {
      return prisma.playlist.update({
        where: { id: args.playlistId },
        data: {
          rankedMembers: {
            create: args.rankedMembers
          }
        }
      })
    },
    editRankedMember(_, { data, id }) {
      return prisma.rankedMember.update({
        where: { id }, data
      })
    },
    deleteRankedMember(_, { id }) {
      return prisma.rankedMember.delete({ id })
    }
  },
  User: {
    playlists({ id }) {
      return prisma.playlist.findMany({ where: {
        creator: { id }
      }}) 
    }
  },  
  Playlist: {
    creator(parent) {
      console.log('the parent: ', parent)
      const id = parent.id
      return prisma.playlist.findOne({ where: { id }})
      .creator()
    },
    rankedMembers({ id }) {
      console.log('this level: ', typeof id)
      return prisma.playlist.findOne({ where: { id }}).rankedMembers()
    }
  },
  RankedMember: {
    restaurant({ id }) {
      return prisma.rankedMember.findOne({ where: { id }}).restaurant()
    }
  },
  Restaurant: {
    featuredIn() {
    }
  }
}

new ApolloServer({ typeDefs, resolvers, plugins: [loggingplugin] }).listen(
  { port: 4000 },
  _ => console.log('serving on port 4000')
)//