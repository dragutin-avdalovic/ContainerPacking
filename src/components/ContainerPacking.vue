<template>
  <div>
    <el-row>
      <el-col class="row-bg-center" :xs="24" :sm="24" :md="24" :lg="12" :xl="12">
        <canvas ref="myCanvas" width="700" height="300" style="border:1px solid #aa22ff ;">
          Your browser does not support the HTML5 canvas tag.
        </canvas>
      </el-col>
      <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="12">
        <el-col class="row-bg-center" :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
          <el-transfer
          v-model="value"
          :data="data"
          :titles="titles">
          </el-transfer>
        </el-col>
        <el-col class="row-bg-center" :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
          <el-button type="danger">Clear selection</el-button>
          <el-button type="primary" v-on:click="fillContainer">Fill the container</el-button>
        </el-col>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import axios from 'axios'
export default {
  name: 'HelloWorld',
  data () {
    return {
      data: [],
      boxes: [],
      value: [],
      titles: ['Boxes', 'Selected Boxes']
    }
  },
  methods: {
    // Function to filter units
    getBoxes () {
      // Make a request for a user with a given ID
      axios.get('http://52.157.147.48:80/PackingAPI/api/v1/GetBoxes')
        .then((response) => {
          this.boxes = response.data
          this.generateData()
        })
        .catch((error) => {
          console.log(error)
        })
    },
    generateData () {
      this.boxes.forEach((box) => {
        this.data.push({
          key: box.ID,
          label: `${box.ID}, ${box.Width}, ${box.Height}`
        })
      })
    },
    fillContainer () {
      console.log(this.value)
      axios.post('http://52.157.147.48:80/PackingAPI/api/v1/FillContainer', {
        ContainerID: '1',
        Boxes: [
          {
            BoxID: 'D',
            Rotated: true
          }
        ]
      }).then(function (response) {
        console.log(response)
      }).catch(function (error) {
        console.log(error)
      })
    }
  },
  created () {
    this.getBoxes()
  },
  mounted () {
    var c = this.$refs.myCanvas
    var ctx = c.getContext('2d')
    var arr = [
      {
        X: 0,
        Y: 0,
        W: 150,
        H: 100
      },
      {
        X: 150,
        Y: 0,
        W: 60,
        H: 100
      },
      {
        X: 0,
        Y: 100,
        W: 60,
        H: 100
      },
      {
        X: 150,
        Y: 100,
        W: 60,
        H: 100
      },
      {
        X: 60,
        Y: 100,
        W: 60,
        H: 50
      },
      {
        X: 60,
        Y: 150,
        W: 60,
        H: 50
      },
      {
        X: 120,
        Y: 100,
        W: 30,
        H: 70
      }
    ]

    arr.map(el => {
      Object.defineProperty(el, 'selected', {
        enumerable: true,
        configurable: true,
        writable: true,
        value: false
      })
      return el
    })

    function createBoxes () {
      arr.forEach(el => {
        ctx.strokeStyle = '#000000'
        if (el.selected) {
          ctx.strokeStyle = '#FF0000'
        }
        ctx.strokeRect(el.X, el.Y, el.W, el.H)
      })
      ctx.stroke()
    }

    function getMousePos (canvas, evt) {
      var rect = c.getBoundingClientRect()
      return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
      }
    }

    c.addEventListener('click', function (evt) {
      var mousePos = getMousePos(c, evt)
      console.log(mousePos.x, mousePos.y)
      arr.map(el => {
        el.selected = false
        if ((mousePos.x > el.X && mousePos.x < (el.X + el.W)) && (mousePos.y > el.Y && mousePos.y < (el.Y + el.H))) {
          el.selected = true
        }
        return el
      })
      createBoxes()
    }, false)

    createBoxes()
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.grid-content {
  min-height: 36px;
}
.row-bg-center {
  padding: 10px 0;
  background-color: #f9fafc;
  display: flex;
  justify-content: center;
}

</style>
