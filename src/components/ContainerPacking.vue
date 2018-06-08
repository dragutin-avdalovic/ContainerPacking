<template>
  <div class="main">
    <el-row >
      <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
        <el-col  class="row-bg-center" :xs="12" :sm="12" :md="12" :lg="12" :xl="12">
          <el-upload
            class="upload-demo"
            drag
            action="http://52.157.147.48:80/PackingAPI/api/v1/UploadFile"
            :on-success = "onSucessUpload"
            :accept="' .xls, .xlsx'"
            multiple>
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">Drop file here or <em>click to upload</em></div>
            <div class="el-upload__tip" slot="tip">Upload type of file - .xls/.xlsx files</div>
          </el-upload>
        </el-col>
        <el-col :xs="12" :sm="12" :md="12" :lg="12" :xl="12">
          <el-col class="row-bg-center">
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
          <el-col class="row-bg-center">
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
          <el-col class="row-bg-center">
          <el-button type="warning" v-on:click="getBoxesAndContainers(type, filename)">Get containers and pallets</el-button>
        </el-col>
        </el-col>
        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
          <el-col class="row-bg-center">
            <el-transfer
              v-model="value"
              :data="data"
              :titles="titles">
            </el-transfer>
          </el-col>
          <el-col class="row-bg-center">
            <span class="chooseContainer">Choose container:</span>
            <el-select style="float: right;" v-model="container" multiple placeholder="Select container">
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
          <el-col class="row-bg-center">
            <el-button type="danger" v-on:click="clearSelection()">Clear selection</el-button>
            <el-button type="primary" v-on:click="fillContainer('FillContainer')">Fill the container</el-button>
            <el-button type="success" v-on:click="fillContainer('GetSolution')">Get solution</el-button>
          </el-col>
        </el-col>
      </el-col>
    </el-row>
    <el-col class="row-bg-center">
      <el-col :xl="12" style="justify-content: flex-end; display: flex;padding-right: 2em;">
        <el-radio v-model="editType" label="Swap" border>Swap</el-radio>
        <el-radio v-model="editType" label="Rotate" border>Rotate</el-radio>
      </el-col>
      <el-col :xl="12" style="justify-content: flex-start; display: flex;">
        <el-button type="warning" v-on:click="refillContainerRotate(rotationScale)">{{editType}} pallets</el-button>
      </el-col>
      </el-col>
    <div class="canvas-div" v-for="(container, index) in containers" v-bind:key="index">
      <canvas :id="'canvas' + index" :ref="'canvas' + index" width="0" height="0" style="border:1px solid red ;">
        Your browser does not support the HTML5 canvas tag.
      </canvas>
    </div>
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
      titles: ['Pallets', 'Selected Pallets'],
      canvas: [],
      context: [],
      container: '',
      containerCopy: [],
      shipping: '',
      type: null,
      shippingTitles: ['By Sea', 'By Truck', 'By Plane', 'Articulated vehicle'],
      filename: '',
      filenames: [],
      contextArray: [],
      fileList: [],
      canvases: [],
      selectedOrder: 0,
      editType: 'Rotate',
      containerRotatedBoxes: [],
      rotationScale: 'FillContainer',
      numberOfCont: 0
    }
  },
  mounted () {
  },
  methods: {
    getMousePos (evt, canvas) {
      var rect = canvas.getBoundingClientRect()
      return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
      }
    },
    addMouseEvent (canvas) {
      if (this.numberOfCont === 1) {
        this.rotationScale = 'FillContainer'
      } else if (this.numberOfCont === 2) {
        this.rotationScale = 'GetSolution'
      }
      canvas.addEventListener('click', (evt) => {
        let mousePos = this.getMousePos(evt, canvas)
        if (this.editType === 'Rotate') {
          this.containerData.forEach((oneContainerData) => {
            oneContainerData.PackedBoxes.map(el => {
              if ((mousePos.x > el.X && mousePos.x < (el.X + el.W)) && (mousePos.y > el.Y && mousePos.y < (el.Y + el.H))) {
                el.Rotated = true
                let result = this.containerRotatedBoxes.find(function (element) { return element.BoxID === el.ID })
                if (result) {
                  console.log('rez')
                  result.Rotated = el.Rotated
                } else {
                  console.log('nema rez')
                  this.containerRotatedBoxes.push({BoxID: el.ID, Rotated: el.Rotated})
                }
              } else {
                el.Rotated = false
              }
              return el
            })
          })
        }
        this.createCustomBoxesAndContainers(this.containerData, this.$refs)
      }, false)
    },
    getContainers () {
      axios.get('http://52.157.147.48:80/PackingAPI/api/v1/GetContainers').then((response) => {
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
        this.boxes = response.data['availableBoxes']
        this.generateData()
        this.containers = response.data['availableContainers']
        this.containers = this.containers.map(container => {
          container.Width /= 10
          container.Height /= 10
          return container
        })
        this.drawContainers()
      }).catch(function (error) {
        console.log(error)
      })
    },
    createCustomBoxesAndContainers (containersAndBoxesArray, refs) {
      var indexOfCanvas = ''
      containersAndBoxesArray.forEach((oneContainerBoxArray) => {
        for (var key in refs) {
          indexOfCanvas = parseInt(key.split('s')[1]) + 1
          if (String(indexOfCanvas) === oneContainerBoxArray.ContainerID) {
            this.context = document.getElementById(key).getContext('2d')
          }
        }
        oneContainerBoxArray.PackedBoxes.forEach(el => {
          this.context.strokeStyle = '#000000'
          if (el.Rotated) {
            this.context.strokeStyle = '#FF0000'
            this.context.lineWidth = 1.25
            this.context.strokeRect(el.X, el.Y, el.W, el.H)
            this.context.font = '15px Arial'
            this.context.fillStyle = 'red'
            this.context.fillText('R', el.X + el.W / 2, el.Y + el.H / 2)
            this.context.font = '15px Arial'
            this.context.fillStyle = 'blue'
            this.context.fillText(el.ID, el.X + el.W / 2, el.Y + el.H / 2 + 20)
            this.context.fillText(el.H, el.X, el.Y + el.H / 2)
            this.context.fillText(el.W, el.X + el.W / 2 - 15, el.Y + 15)
          } else {
            this.context.strokeStyle = '#2F4F4F'
            this.context.lineWidth = 1
            this.context.strokeRect(el.X, el.Y, el.W, el.H)
            this.context.font = '15px Arial'
            this.context.fillStyle = 'blue'
            this.context.fillText(el.ID, el.X + el.W / 2, el.Y + el.H / 2 + 20)
            this.context.fillText(el.H, el.X, el.Y + el.H / 2)
            this.context.fillText(el.W, el.X + el.W / 2 - 15, el.Y + 15)
          }
        })
        this.context.stroke()
      })
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
      if (String(this.container).valueOf() !== '') {
        this.clearContainers()
        this.containerBoxes = []
        this.containerRotatedBoxes = []
        this.value.forEach((value) => {
          this.containerBoxes.push({BoxID: value, Rotated: false})
        })

        let obj = {
          Boxes: this.containerBoxes
        }
        if (type !== 'FillContainer') {
          this.container.forEach((container, i) => {
            this.containerCopy[i] = parseInt(container) + 1
          })
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
            value: this.containerCopy
          })
        } else {
          Object.defineProperty(obj, 'ContainerID', {
            enumerable: true,
            configurable: true,
            writable: true,
            value: parseInt(this.container) + 1
          })
        }
        axios.post('http://52.157.147.48:80/PackingAPI/api/v1/' + type, obj).then((response) => {
          this.containerData = response.data
          Object.assign({}, this.containerData)
          this.containerData.forEach((oneContainerData) => {
            oneContainerData.PackedBoxes.map(box => {
              Object.defineProperty(box, 'selected', {
                enumerable: true,
                configurable: true,
                writable: true,
                value: false
              })
              Object.defineProperty(box, 'Rotated', {
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
          })
          this.createCustomBoxesAndContainers(this.containerData, this.$refs)
          this.containerData.forEach((oneContainerData) => {
            oneContainerData.PackedBoxes.map(el => {
              this.containerRotatedBoxes.push({BoxID: el.ID, Rotated: false})
            })
          })
        }).catch(function (error) {
          console.log(error)
        })
      } else {
        this.notifyChooseContainer()
      }
    },
    refillContainerRotate (type) {
      if (String(this.container).valueOf() !== '') {
        this.clearContainers()
        let obj = {
          Boxes: this.containerRotatedBoxes
        }
        if (type !== 'FillContainer') {
          this.container.forEach((container, i) => {
            this.containerCopy[i] = parseInt(container) + 1
          })
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
            value: this.containerCopy
          })
        } else {
          Object.defineProperty(obj, 'ContainerID', {
            enumerable: true,
            configurable: true,
            writable: true,
            value: parseInt(this.container) + 1
          })
        }
        axios.post('http://52.157.147.48:80/PackingAPI/api/v1/' + type, obj).then((response) => {
          this.containerData = response.data
          Object.assign({}, this.containerData)
          this.containerData.forEach((oneContainerData) => {
            oneContainerData.PackedBoxes.map(box => {
              Object.defineProperty(box, 'Rotated', {
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
          })
          this.createCustomBoxesAndContainers(this.containerData, this.$refs)
          this.containerRotatedBoxes.forEach((oneBox) => {
            oneBox.Rotated = false
          })
        }).catch(function (error) {
          console.log(error)
        })
      } else {
        this.notifyChooseContainer()
      }
    },
    clearSelection () {
      this.value = []
      this.clearContainers()
    },
    drawContainer () {
      this.$refs.myCanvas.width = this.containers[this.container].Width
      this.$refs.myCanvas.height = this.containers[this.container].Height
      this.context.font = '15px Arial'
      this.context.fillStyle = 'red'
      this.context.fillText(this.$refs.myCanvas.height, 20, this.$refs.myCanvas.height / 2)
      this.context.fillText(this.$refs.myCanvas.width, this.$refs.myCanvas.width / 2, 20)
    },
    drawContainers () {
      var index = ''
      this.numberOfCont = 0
      setTimeout(() => {
        for (var key in this.$refs) {
          if (this.$refs.hasOwnProperty(key)) {
            this.numberOfCont = this.numberOfCont + 1
            index = key.split('s')[1]
            this.canvas = document.getElementById(key)
            this.addMouseEvent(this.canvas)
            this.canvas.width = this.containers[index].Width
            this.canvas.height = this.containers[index].Height
            this.context = document.getElementById(key).getContext('2d')
            this.context.font = '15px Arial'
            this.context.fillStyle = 'red'
            this.context.fillText(this.canvas.height, 20, this.canvas.height / 2)
            this.context.fillText(this.canvas.width, this.canvas.width / 2, 20)
            console.log(this.numberOfCont)
          }
        }
      }, 5000)
      console.log(this.numberOfCont)
    },
    clearContainers () {
      var index = ''
      for (var key in this.$refs) {
        if (this.$refs.hasOwnProperty(key)) {
          index = key.split('s')[1]
          this.canvas = document.getElementById(key)
          this.canvas.width = this.containers[index].Width
          this.canvas.height = this.containers[index].Height
          this.context = document.getElementById(key).getContext('2d')
          this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
        }
      }
    },
    convertType () {
      this.type = parseInt(this.shipping) + 1
    },
    onSucessUpload: function (response, file, fileList) {
      this.filenames.push(response)
    },
    notifyChooseContainer () {
      this.$notify.error({
        title: 'Error',
        message: 'Please choose a container to fill'
      })
    }
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
  padding: 10px 10px;
  margin-top: 0.5em;
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
.canvas-div
{
  margin: 1em;
}

</style>
