n<template>
  <div class="main">
    <el-row>
      <el-col class="row-bg-center" :xs="24" :sm="24" :md="24" :lg="14" :xl="14" v-for="(container, index) in containers" v-bind:key="index">
        <canvas  :ref="'canvas' + index" width="10" height="10" style="border:1px solid red ;">
          Your browser does not support the HTML5 canvas tag.
        </canvas>
      </el-col>
      <el-col :xs="24" :sm="24" :md="24" :lg="10" :xl="10">
        <el-col class="row-bg-center" :xs="12" :sm="12" :md="12" :lg="12" :xl="12">
          <span class="chooseType">Shiping type: </span>
          <el-select style="float: right;" v-model="shipping" v-on:change="convertType()" placeholder="Shiping type">
            <el-option
              v-for="(item, index) in shippingTitles"
              :key="index"
              :value="index"
            >
              <span style="float: left; color: #0000ff">{{item}}</span>
            </el-option>
          </el-select>
        </el-col>
        <el-col class="row-bg-center" :xs="12" :sm="12" :md="12" :lg="12" :xl="12">
          <span class="chooseType">File name: </span>
          <el-select style="float: right;" v-model="filename" placeholder="File name">
            <el-option
              v-for="(item, index) in filenames"
              :key="index"
              :value="item"
            >
              <span style="float: left; color: #0000ff">{{item}}</span>
            </el-option>
          </el-select>
        </el-col>
        <el-col class="row-bg-center" :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
          <el-button type="warning" v-on:click="getBoxesAndContainers(type, filename)">Get new data</el-button>
        </el-col>
        <el-col class="row-bg-center" :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
          <span class="chooseContainer">Choose container:</span>
          <el-select style="float: right;" v-on:change="drawContainer()" v-model="container" placeholder="Select container">
            <el-option
              v-for="(item, index) in containers"
              :key="item.ID"
              :value="index"
            >
              <span style="float: left; color: #0000ff">{{ item.ID }}</span>
              <span style="float: right; color: #ff0000; font-size: 13px">W: {{ item.Width }}, H: {{ item.Height }}, T: {{  item.Type}}</span>
            </el-option>
          </el-select>
        </el-col>
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
      containerData: [],
      titles: ['Boxes', 'Selected Boxes'],
      context: null,
      container: '1',
      canvas: null,
      shipping: '',
      type: null,
      shippingTitles: ['By Sea', 'By Truck', 'By Plane', 'Articulated vehicle'],
      filename: '',
      filenames: ['PALLETS3.xls']
    }
  },
  methods: {
    getMousePos (evt) {
      var rect = this.canvas.getBoundingClientRect()
      return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
      }
    },
    addMouseEvent () {
      this.canvas.addEventListener('click', (evt) => {
        let mousePos = this.getMousePos(evt)
        this.containerData[0].PackedBoxes.map(el => {
          el.selected = false
          if ((mousePos.x > el.X && mousePos.x < (el.X + el.W)) && (mousePos.y > el.Y && mousePos.y < (el.Y + el.H))) {
            el.selected = true
          }
          return el
        })
        this.createCustomBoxes(this.containerData[0].PackedBoxes, this.context)
      }, false)
    },
    getContainers () {
      axios.get('http://52.157.147.48:80/PackingAPI/api/v1/GetContainers').then((response) => {
        console.log(response.data)
        this.containers = response.data.map(container => {
          container.Width /= 10
          container.Height /= 10
          return container
        })
        this.$refs.myCanvas.width = this.containers[0].Width
        this.$refs.myCanvas.height = this.containers[0].Height
        this.context.font = '15px Arial'
        this.context.fillStyle = 'red'
        this.context.fillText(this.$refs.myCanvas.height, 20, this.$refs.myCanvas.height / 2)
        this.context.fillText(this.$refs.myCanvas.width, this.$refs.myCanvas.width / 2, 20)
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
    getBoxesAndContainers (type, filename) {
      axios.post('http://52.157.147.48:80/PackingAPI/api/v1/GetBoxesAndContainers?fileName=' + filename + '&typeofcont=' + type).then((response) => {
        console.log(response.data)
        this.boxes = response.data['availableBoxes']
        this.generateData()
        this.containers = response.data['availableContainers']
        this.containers = this.containers.map(container => {
          container.Width /= 10
          container.Height /= 10
          return container
        })
        this.$refs.myCanvas.width = this.containers[0].Width
        this.$refs.myCanvas.height = this.containers[0].Height
        this.context.font = '15px Arial'
        this.context.fillStyle = 'red'
        this.context.fillText(this.$refs.myCanvas.height, 20, this.$refs.myCanvas.height / 2)
        this.context.fillText(this.$refs.myCanvas.width, this.$refs.myCanvas.width / 2, 20)
      }).catch(function (error) {
        console.log(error)
      })
    },
    createCustomBoxes (boxArray, context) {
      this.context.clearRect(0, 0, this.$refs.myCanvas.width, this.$refs.myCanvas.height)
      boxArray.forEach(el => {
        context.strokeStyle = '#000000'
        if (el.selected) {
          context.strokeStyle = '#FF0000'
        }
        context.strokeRect(el.X, el.Y, el.W, el.H)
        context.font = '15px Arial'
        context.fillStyle = 'blue'
        context.fillText(el.ID, el.X + el.W / 2, el.Y + el.H / 2)
        context.fillText(el.H, el.X, el.Y + el.H / 2)
        context.fillText(el.W, el.X + el.W / 2 - 15, el.Y + 15)
      })
      context.stroke()
    },
    generateData () {
      this.data = []
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
          value: [parseInt(this.container) + 1]
        })
      } else {
        Object.defineProperty(obj, 'ContainerID', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: parseInt(this.container) + 1
        })
      }
      console.log(obj)
      axios.post('http://52.157.147.48:80/PackingAPI/api/v1/' + type, obj).then((response) => {
        this.containerData = response.data

        this.containerData[0].PackedBoxes.map(box => {
          Object.defineProperty(box, 'selected', {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
          })
          box.W /= 10
          box.H /= 10
          box.X /= 10
          box.Y /= 10
          return box
        })
        this.createCustomBoxes(this.containerData[0].PackedBoxes, this.context)
      }).catch(function (error) {
        console.log(error)
      })
    },
    clearSelection () {
      this.value = []
      this.context.clearRect(0, 0, this.$refs.myCanvas.width, this.$refs.myCanvas.height)
    },
    drawContainer () {
      console.log(this.container)
      this.$refs.myCanvas.width = this.containers[this.container].Width
      this.$refs.myCanvas.height = this.containers[this.container].Height
      this.context.font = '15px Arial'
      this.context.fillStyle = 'red'
      this.context.fillText(this.$refs.myCanvas.height, 20, this.$refs.myCanvas.height / 2)
      this.context.fillText(this.$refs.myCanvas.width, this.$refs.myCanvas.width / 2, 20)
    },
    convertType () {
      this.type = parseInt(this.shipping) + 1
    }
  },
  created () {
    // this.getBoxes()
    this.getContainers()
  },
  mounted () {
    //var c = this.$refs.canvas0
    //var ctx = c.getContext('2d')
    //this.context = ctx
    //this.canvas = c
    console.log(this.$refs)
    //    this.addMouseEvent()
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
  align-items: center;
  padding: 10px 0;
}
.chooseContainer
{
  font-size: 1em;
  color: dodgerblue;
  padding-right: 1em;
}
.chooseType
{
  font-size: 1em;
  color: green;
  padding-right: 0.5em;
}
  .main
{
    padding-top: 2em;
    padding-bottom: 2em;
  }

</style>
