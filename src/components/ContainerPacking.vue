<template>
  <div>
    <el-row>
      <el-col class="row-bg-center" :xs="24" :sm="24" :md="24" :lg="14" :xl="14">
        <canvas ref="myCanvas" width="100" height="100" style="border:1px solid red ;">
          Your browser does not support the HTML5 canvas tag.
        </canvas>
      </el-col>
      <el-col :xs="24" :sm="24" :md="24" :lg="10" :xl="10">
        <el-col class="row-bg-center" :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
          <el-transfer
          v-model="value"
          :data="data"
          :titles="titles">
          </el-transfer>
        </el-col>
        <el-col class="row-bg-center" :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
          <el-button type="danger" v-on:click="clearSelection()">Clear selection</el-button>
          <el-button type="primary" v-on:click="fillContainer('FillContainer')">Fill the container</el-button>
          <el-button type="success" v-on:click="fillContainer('GetSolution')">Get solution</el-button>
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
      containers: [],
      containerBoxes: [],
      value: [],
      containerData: {},
      titles: ['Boxes', 'Selected Boxes'],
      context: null
    }
  },
  methods: {
    getContainers () {
      axios.get('http://52.157.147.48:80/PackingAPI/api/v1/GetContainers').then((response) => {
        console.log(response.data)
        this.containers = response.data
        this.$refs.myCanvas.width = this.containers[1].Width
        this.$refs.myCanvas.height = this.containers[1].Height
      }).catch(function (error) {
        console.log(error)
      })
    },
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
    createCustomBoxes (boxArray, context) {
      boxArray.forEach(el => {
        context.strokeStyle = '#000000'
        if (el.selected) {
          context.strokeStyle = '#FF0000'
        }
        context.strokeRect(el.X, el.Y, el.W, el.H)
      })
      context.stroke()
    },
    generateData () {
      this.boxes.forEach((box) => {
        this.data.push({
          key: box.ID,
          label: `${box.ID}, ${box.Width}, ${box.Height}`
        })
      })
    },
    fillContainer (type) {
      this.containerBoxes = []
      this.value.forEach((value) => {
        this.containerBoxes.push({BoxID: value, Rotated: false})
      })

      let obj = {
        Boxes: this.containerBoxes
      }
      if (type !== 'FillContainer') {
        Object.defineProperty(obj, 'Rotation', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: true
        })
        Object.defineProperty(obj, 'ContainerIDs', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: ['1']
        })
      } else {
        Object.defineProperty(obj, 'ContainerID', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: '1'
        })
      }
      console.log(obj)
      axios.post('http://52.157.147.48:80/PackingAPI/api/v1/' + type, obj).then((response) => {
        Object.assign(this.containerData, response.data)
        if (this.containerData.PackedBoxes) {
          this.containerData.PackedBoxes.map(el => {
            Object.defineProperty(el, 'selected', {
              enumerable: true,
              configurable: true,
              writable: true,
              value: false
            })
            return el
          })
        }
        console.log(this.containerData)
        this.createCustomBoxes(this.containerData.PackedBoxes, this.context)
      }).catch(function (error) {
        console.log(error)
      })
    },
    clearSelection () {
      this.value = []
      this.context.clearRect(0, 0, this.$refs.myCanvas.width, this.$refs.myCanvas.height)
    }
  },
  created () {
    this.getBoxes()
    this.getContainers()
  },
  mounted () {
    var c = this.$refs.myCanvas
    var ctx = c.getContext('2d')
    this.context = ctx

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
      //      this.createCustomBoxes(this.containerData.PackedBoxes, this.context)
    }, false)
    //    this.createCustomBoxes(this.containerData.PackedBoxes, this.context)
  }
}
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
.grid-content {
  min-height: 36px;
}
.row-bg-center {
  display: flex;
  justify-content: center;
  padding: 10px 0;
}

</style>
