const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose= require('mongoose')

app.use(cors())
app.use(express.urlencoded({extended:false}))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const userSchema= new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
})

const User= mongoose.model('User', userSchema)

app.post('/api/users', async(req, res) => {
  try{
  const {username}= req.body

  const user= await User.create({username})

  res.json({username: user.username, _id: user._id})
  } catch(error) {
     console.log(error)
     res.status(500).json('error')
  }
})

app.get('/api/users', async(req, res) => {
  try{
  const users= await User.find({}, 'username _id')

  res.json(users)
  } catch(error) {
    console.log(error)
     res.status(500).json('error')
  }
})


const exerciseSchema= new mongoose.Schema({
  user:{
    type: mongoose.Types.ObjectId,
    ref: 'User',
    default: null

  },
  description:{
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date:{
    type: Date,
    default: Date.now
  }
  
})

const Exercise= mongoose.model('Exercise', exerciseSchema)


app.post('/api/users/:_id/exercises', async(req, res) => {
  try{
  const {duration, description, date}= req.body 
  const userId= req.params._id

  const user= await User.findById(userId)
  if(!user) return res.status(404).json('not found')

  const exercise= new Exercise({
    user: user._id,
    description,
    duration: parseInt(duration),
    date: date ? new Date(date) : new Date()
  })

  const savedExercise= await exercise.save()

  res.json({
    username: user.username,
    description: savedExercise.description,
    duration: savedExercise.duration,
    date: savedExercise.date.toDateString(), 
    _id: user._id
  })

  } catch(error) {
    console.log(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
})

app.get('/api/users/:_id/logs', async(req, res) => {
  try {

  const userId= req.params._id 
  const{from, to, limit}= req.query
  const user= await User.findById(userId)

  
     const query = { user: userId };
    const dateFilter = {};

    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    if (from || to) query.date = dateFilter;

    let exercisesQuery = Exercise.find(query);
    if (limit) {
      exercisesQuery = exercisesQuery.limit(Number(limit));
    }


  const exercises= await exercisesQuery 
  
  const log= exercises.map((e) => ({
    description: e.description,
    duration: e.duration,
    date: new Date(e.date).toDateString()
  }) )

  res.json({
    username: user.username,
    _id: user._id,
    count: log.length,
    from,
    to,
    log: log
  })

    } catch(error) {
      console.log(error);
    res.status(500).json({ error: 'Something went wrong' });
    }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
