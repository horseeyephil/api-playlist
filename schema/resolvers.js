const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient({ log: ['query', 'info', 'warn']})

const resolvers = {
  Query: {
    user(_, { username }) {
      return prisma.user.findOne({ 
        where: { username }
      })
    },
    playlist(_, { id }) {
      return prisma.playlist.findOne({ where: { id }})
    },
    playlistSearch(_, { keyword }) {
      return prisma.playlist.findMany({
        where: { title: {
          contains: keyword
        }}
      })
    },
    restaurant(_, { id }) {
      return prisma.restaurant.findOne({ where: { id }})
    },
    restaurantsByName(_, { name }) {
      return prisma.restaurant.findMany({
        where: { name: { 
          contains: name.toLowerCase()
        }}
      })
    },
    async restaurantSearch(_, { keyword }) {
      console.log('hi', keyword)
      const key = keyword + '%'
      const r = await prisma.raw`SELECT * FROM "public"."Restaurant" WHERE name ILIKE ${key};`
      console.log('whooooooo', r)
      return r
    }
  },
  Mutation: {
    addUser(_, data) {
      return prisma.user.create({ data })
    },
    createPlaylist(_, args, { authedUser }) {
      if (!authedUser) throw new Error('User not authorized.')
      if (authedUser.id !== args.creatorId) throw new Error('Bad Id match.')

      return prisma.playlist.create({ data: {
        title: args.title,
        description: args.description,
        creator: { connect: { id: authedUser.id }},
      }})
    },
    async createMemberWithRestaurant(_, args, { authedUser }) {
        const id = parseInt(args.playlistId)
        const playlist = await prisma.playlist.findOne({ where: { id }})

        if (!authedUser) throw new Error('Need to authorize!')
        if (authedUser.id !== playlist.userId) throw new Error('Bad id match.')

        return prisma.rankedMember.create({ data: {
        ...args.rankedMember, 
        playlist: { connect: { id }},
        restaurant: { 
          create: args.restaurant
        }
      }})
    },
    async addToPlaylist(_, args, { authedUser }) {
      const playlist = await prisma.playlist.findOne({ where: { id: args.playlistId }})
      
      if (!authedUser) throw new Error('Need to authorize!')
      if (authedUser.id !== playlist.userId) throw new Error('Bad id match.')
      
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

module.exports = {
  prisma,
  resolvers
}
