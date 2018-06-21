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
          <el-button :loading="loadingGetBoxesAndCont" type="warning" v-on:click="getBoxesAndContainers(type, filename)">Get containers and pallets</el-button>
        </el-col>
        </el-col>
      </el-col>
    </el-row>
    <el-row class="row-bg-center">
      <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
        <el-col class="row-bg-center">
          <el-transfer
            v-model="value"
            :data="data"
            :titles="titles">
          </el-transfer>
        </el-col>
        <el-col class="row-bg-center">
          <span class="chooseContainer">Choose container to fill:</span>
          <el-select id="choose-select" style="float: right;" v-model="container" multiple placeholder="Select container">
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
          <el-button type="danger" :loading="loadingClearSolution" v-on:click="clearSelection">Clear selection</el-button>
          <el-button type="primary" :loading="loadingFillContainer" v-on:click="fillContainer('FillContainer')">Fill the container</el-button>
          <el-button type="success" :loading="loadingGetSolution" v-on:click="fillContainer('GetSolution')">Get solution</el-button>
        </el-col>
      </el-col>
    </el-row>
    <el-row class="row-bg-center-canvas" v-for="(container, index) in containers" v-bind:key="index">
      <div class="canvas-div">
        <canvas :id="'canvas' + index" :ref="'canvas' + index" width="0" height="0" style="border:1px solid #c08d13 ;">
          Your browser does not support the HTML5 canvas tag.
        </canvas>
      </div>
    </el-row>
    <el-row  class="row-bg-center">
      <span class="chooseContainer">Choose container to edit:</span>
      <el-select id ="edit-select" v-on:change="displayContainer(containerForEdit)" style="float: right;" v-model="containerForEdit" placeholder="Select container">
        <el-option
          v-for="(item, index) in containers"
          :key="item.ID"
          :value="index"
        >
          <span style="float: left; color: #0000ff">{{ item.ID }}</span>
          <span style="float: right; color: #ff0000; font-size: 13px">W: {{ item.Width }}, H: {{ item.Height }}, T: {{  item.Type}}</span>
        </el-option>
      </el-select>
    </el-row>
    <el-row class="row-bg-center">
      <el-col :xl="24" class="row-bg-center">
        <el-radio v-model="editType" label="Swap" border v-on:change="clearEdit">Swap</el-radio>
        <el-radio v-model="editType" label="Rotate" border v-on:change="clearEdit">Rotate</el-radio>
        <el-radio v-model="editType" label="Remove" border v-on:change="clearEdit">Remove</el-radio>
        <el-button style="margin-left: 2em;" :loading="loadingEdit" type="success" v-on:click="refillContainer(editType)">{{editType}} pallets</el-button>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import axios from 'axios'
import _ from 'lodash'

export default {
  name: 'ContainerPacking',
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
      editingScale: 'FillContainer',
      numberOfCont: 0,
      loadingGetBoxesAndCont: false,
      loadingFillContainer: false,
      loadingGetSolution: false,
      loadingClearSolution: false,
      loadingEdit: false,
      EditQueue: 0,
      editFinished: false,
      filteredObject: {},
      firstForEdit: {},
      secondForEdit: {},
      containerSwapedBoxes: [],
      containerAfterRemoval: [],
      containerForEdit: null,
      globalCanvasEdit: null,
      arrayOfCanvases: [],
      currentEdit: null,
      previousEdited: null,
      oneContainerAndBoxesArray: []
    }
  },
  mounted () {
  },
  methods: {
    clearEdit () {
      console.log('clearing between operations')
      this.editFinished = false
      this.EditQueue = 0
      _.forEach(this.containerData, (container, index) => {
        console.log(container)
        _.forEach(container.PackedBoxes, (box, index) => {
          box.Rotated = false
          box.EditQueue = 0
          box.Deleted = false
        })
      })
      this.clearContainers()
      this.createCustomBoxesAndContainers(this.containerData, this.$refs, this.containerForEdit)
    },
    getMousePos (evt, canvas) {
      var rect = canvas.getBoundingClientRect()
      return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
      }
    },
    handleEditCanvas (evt) {
      let mousePos = this.getMousePos(evt, this.globalCanvasEdit)
      if (this.editType === 'Rotate') {
        this.containerData.forEach((oneContainerData) => {
          oneContainerData.PackedBoxes.map(el => {
            if ((mousePos.x > el.X && mousePos.x < (el.X + el.W)) && (mousePos.y > el.Y && mousePos.y < (el.Y + el.H))) {
              el.Rotated = true
              let result = this.containerRotatedBoxes.find(function (element) { return element.BoxID === el.ID })
              if (result) {
                console.log('vec u nizu')
                result.Rotated = el.Rotated
                console.log(result)
              } else {
                console.log('nema u nizu paleta')
                this.containerRotatedBoxes.push({BoxID: el.ID, Rotated: el.Rotated})
              }
            } else {
              el.Rotated = false
            }
            return el
          })
        })
      } else if (this.editType === 'Swap') {
        if (!this.editFinished) {
          this.containerData.forEach((oneContainerData) => {
            oneContainerData.PackedBoxes.map(el => {
              if ((mousePos.x > el.X && mousePos.x < (el.X + el.W)) && (mousePos.y > el.Y && mousePos.y < (el.Y + el.H))) {
                if (parseInt(this.EditQueue) === 1) {
                  this.editFinished = true
                }
                this.EditQueue += 1
                el.EditQueue = this.EditQueue
                let result = this.containerRotatedBoxes.find(function (element) { return element.BoxID === el.ID })
                if (result) {
                  console.log('vec u nizu paleta')
                  result.EditQueue = this.EditQueue
                  _.forEach(this.containerData, (container, index) => {
                    console.log(container)
                    if (_.isEmpty(this.firstForEdit)) {
                      this.firstForEdit = _.find(container.PackedBoxes, { 'EditQueue': 1 })
                    } else if (_.isEmpty(this.secondForEdit)) {
                      this.secondForEdit = _.find(container.PackedBoxes, { 'EditQueue': 2 })
                    } else if (!_.isEmpty(this.secondForEdit) && !_.isEmpty(this.firstForEdit)) {
                      this.$notify.warning({
                        title: 'Warning',
                        message: 'Two pallets for swap are selected'
                      })
                    }
                  })
                } else {
                  console.log('nema u nizu paleta')
                  this.containerRotatedBoxes.push({BoxID: el.ID, Rotated: el.Rotated})
                }
              } else {
              }
              return el
            })
          })
        } else {
          this.$notify.warning({
            title: 'Warning',
            message: 'Only two pallets can be swaped.'
          })
        }
      } else if (this.editType === 'Remove') {
        this.containerData.forEach((oneContainerData) => {
          oneContainerData.PackedBoxes.map(el => {
            if ((mousePos.x > el.X && mousePos.x < (el.X + el.W)) && (mousePos.y > el.Y && mousePos.y < (el.Y + el.H))) {
              el.Deleted = true
              let result = this.containerRotatedBoxes.find(function (element) { return element.BoxID === el.ID })
              if (result) {
                console.log('vec u nizu')
                result.Deleted = el.Deleted
              } else {
                console.log('nema u nizu paleta')
                this.containerRotatedBoxes.push({BoxID: el.ID, Deleted: el.Deleted})
              }
            } else {
              el.Deleted = false
            }
            return el
          })
        })
      }
      console.log('container data before showing')
      console.log(this.containerRotatedBoxes)
      this.createCustomBoxesAndContainers(this.containerData, this.$refs, this.containerForEdit)
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
      this.clearSelection()
      this.containers = []
      this.containerForEdit = ''
      this.container = []
      this.value = []
      this.containerData = []
      this.loadingGetBoxesAndCont = true
      if (filename !== '' && type !== null) {
        axios.post('http://52.157.147.48:80/PackingAPI/api/v1/GetBoxesAndContainers?fileName=' + filename + '&typeofcont=' + type).then((response) => {
          this.boxes = response.data['availableBoxes']
          this.generateData()
          this.containers = response.data['availableContainers']
          this.containers = this.containers.map(container => {
            container.Width /= 10
            container.Height /= 10
            return container
          })
          this.loadingGetBoxesAndCont = false
          this.drawContainers()
        }).catch(function (error) {
          this.loadingGetBoxesAndCont = false
          console.log(error)
        })
      } else {
        this.$notify.error({
          title: 'Error',
          message: 'Please select both shipping type and file name'
        })
        this.loadingGetBoxesAndCont = false
      }
    },
    createCustomBoxesAndContainers (containersAndBoxesArray, refs, containerForEdit) {
      this.oneContainerAndBoxesArray = []
      if (containerForEdit === null || containerForEdit === '') {
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
              this.context.strokeStyle = '#ff6f09'
              this.context.lineWidth = 1.25
              this.context.strokeRect(el.X, el.Y, el.W, el.H)
              this.context.font = '15px Arial'
              this.context.fillStyle = '#ff6f09'
              this.context.fillText('R', el.X + el.W / 2, el.Y + el.H / 2)
              this.context.font = '15px Arial'
              this.context.fillStyle = 'blue'
              this.context.fillText(el.ID, el.X + el.W / 2, el.Y + el.H / 2 + 20)
              this.context.fillText(el.H, el.X, el.Y + el.H / 2)
              this.context.fillText(el.W, el.X + el.W / 2 - 15, el.Y + 15)
            } else if (el.EditQueue > 0) {
              this.context.strokeStyle = '#40ff0c'
              this.context.lineWidth = 1.25
              this.context.strokeRect(el.X, el.Y, el.W, el.H)
              this.context.font = '15px Arial'
              this.context.fillStyle = '#40ff0c'
              this.context.fillText(el.EditQueue, el.X + el.W / 2, el.Y + el.H / 2)
              this.context.font = '15px Arial'
              this.context.fillStyle = 'blue'
              this.context.fillText(el.ID, el.X + el.W / 2, el.Y + el.H / 2 + 20)
              this.context.fillText(el.H, el.X, el.Y + el.H / 2)
              this.context.fillText(el.W, el.X + el.W / 2 - 15, el.Y + 15)
            } else if (el.Deleted === true) {
              this.context.strokeStyle = '#FF0000'
              this.context.lineWidth = 1.25
              this.context.strokeRect(el.X, el.Y, el.W, el.H)
              this.context.font = '15px Arial'
              this.context.fillStyle = '#FF0000'
              this.context.fillText('D', el.X + el.W / 2, el.Y + el.H / 2)
              this.context.font = '15px Arial'
              this.context.fillStyle = 'blue'
              this.context.fillText(el.ID, el.X + el.W / 2, el.Y + el.H / 2 + 20)
              this.context.fillText(el.H, el.X, el.Y + el.H / 2)
              this.context.fillText(el.W, el.X + el.W / 2 - 15, el.Y + 15)
            } else {
              this.context.strokeStyle = '#272041'
              this.context.lineWidth = 1
              this.context.strokeRect(el.X, el.Y, el.W, el.H)
              this.context.font = '15px Arial'
              this.context.fillStyle = '#001cff'
              this.context.fillText(el.ID, el.X + el.W / 2, el.Y + el.H / 2 + 20)
              this.context.fillText(el.H, el.X, el.Y + el.H / 2)
              this.context.fillText(el.W, el.X + el.W / 2 - 15, el.Y + 15)
            }
          })
          this.context.stroke()
        })
      } else {
        var keyOfCanvas = ''
        var realContainerId = containerForEdit + 1
        containersAndBoxesArray.forEach((oneContainerBoxArray) => {
          console.log('selected kont')
          console.log(realContainerId)
          console.log('kont')
          console.log(oneContainerBoxArray.ContainerID)
          if (String(realContainerId) === oneContainerBoxArray.ContainerID) {
            console.log('nasao sam kont')
            keyOfCanvas = 'canvas' + containerForEdit
            console.log(keyOfCanvas)
            this.context = document.getElementById(keyOfCanvas).getContext('2d')
            this.oneContainerAndBoxesArray = oneContainerBoxArray.PackedBoxes
          }
        })
        this.oneContainerAndBoxesArray.forEach(el => {
          this.context.strokeStyle = '#000000'
          if (el.Rotated) {
            this.context.strokeStyle = '#ff6f09'
            this.context.lineWidth = 1.25
            this.context.strokeRect(el.X, el.Y, el.W, el.H)
            this.context.font = '15px Arial'
            this.context.fillStyle = '#ff6f09'
            this.context.fillText('R', el.X + el.W / 2, el.Y + el.H / 2)
            this.context.font = '15px Arial'
            this.context.fillStyle = 'blue'
            this.context.fillText(el.ID, el.X + el.W / 2, el.Y + el.H / 2 + 20)
            this.context.fillText(el.H, el.X, el.Y + el.H / 2)
            this.context.fillText(el.W, el.X + el.W / 2 - 15, el.Y + 15)
          } else if (el.EditQueue > 0) {
            this.context.strokeStyle = '#40ff0c'
            this.context.lineWidth = 1.25
            this.context.strokeRect(el.X, el.Y, el.W, el.H)
            this.context.font = '15px Arial'
            this.context.fillStyle = '#40ff0c'
            this.context.fillText(el.EditQueue, el.X + el.W / 2, el.Y + el.H / 2)
            this.context.font = '15px Arial'
            this.context.fillStyle = 'blue'
            this.context.fillText(el.ID, el.X + el.W / 2, el.Y + el.H / 2 + 20)
            this.context.fillText(el.H, el.X, el.Y + el.H / 2)
            this.context.fillText(el.W, el.X + el.W / 2 - 15, el.Y + 15)
          } else if (el.Deleted === true) {
            this.context.strokeStyle = '#FF0000'
            this.context.lineWidth = 1.25
            this.context.strokeRect(el.X, el.Y, el.W, el.H)
            this.context.font = '15px Arial'
            this.context.fillStyle = '#FF0000'
            this.context.fillText('D', el.X + el.W / 2, el.Y + el.H / 2)
            this.context.font = '15px Arial'
            this.context.fillStyle = 'blue'
            this.context.fillText(el.ID, el.X + el.W / 2, el.Y + el.H / 2 + 20)
            this.context.fillText(el.H, el.X, el.Y + el.H / 2)
            this.context.fillText(el.W, el.X + el.W / 2 - 15, el.Y + 15)
          } else {
            this.context.strokeStyle = '#272041'
            this.context.lineWidth = 1
            this.context.strokeRect(el.X, el.Y, el.W, el.H)
            this.context.font = '15px Arial'
            this.context.fillStyle = '#001cff'
            this.context.fillText(el.ID, el.X + el.W / 2, el.Y + el.H / 2 + 20)
            this.context.fillText(el.H, el.X, el.Y + el.H / 2)
            this.context.fillText(el.W, el.X + el.W / 2 - 15, el.Y + 15)
          }
        })
        this.context.stroke()
      }
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
      if (type === 'FillContainer') {
        this.loadingFillContainer = true
      } else {
        this.loadingGetSolution = true
      }
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
          console.log('after fill data')
          console.log(this.containerData)
          this.value = []
          _.forEach(this.containerData[0].PackedBoxes, (boxes) => {
            this.value.push(boxes.ID)
          })
          Object.assign({}, this.containerData)
          this.containerData.forEach((oneContainerData) => {
            oneContainerData.PackedBoxes.map(box => {
              Object.defineProperty(box, 'Rotated', {
                enumerable: true,
                configurable: true,
                writable: true,
                value: false
              })
              Object.defineProperty(box, 'EditQueue', {
                enumerable: true,
                configurable: true,
                writable: true,
                value: 0
              })
              box.W /= 10
              box.H /= 10
              box.X /= 10
              box.Y /= 10
              return box
            })
          })
          this.createCustomBoxesAndContainers(this.containerData, this.$refs, this.containerForEdit)
          this.containerData.forEach((oneContainerData) => {
            oneContainerData.PackedBoxes.map(el => {
              this.containerRotatedBoxes.push({BoxID: el.ID, Rotated: false})
            })
          })
          this.loadingFillContainer = false
          this.loadingGetSolution = false
        }).catch(function (error) {
          console.log(error)
          this.loadingFillContainer = false
          this.loadingGetSolution = false
        })
      } else {
        this.notifyChooseContainer()
        this.loadingFillContainer = false
        this.loadingGetSolution = false
      }
    },
    refillContainer (type) {
      this.loadingEdit = true
      if (this.containerForEdit !== null) {
        if (type === 'Rotate') {
          if (String(this.container).valueOf() !== '') {
            this.clearContainers()
            let obj = {
              Boxes: this.containerRotatedBoxes
            }
            Object.defineProperty(obj, 'ContainerID', {
              enumerable: true,
              configurable: true,
              writable: true,
              value: parseInt(this.container) + 1
            })
            axios.post('http://52.157.147.48:80/PackingAPI/api/v1/FillContainer', obj).then((response) => {
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
                  Object.defineProperty(box, 'EditQueue', {
                    enumerable: true,
                    configurable: true,
                    writable: true,
                    value: 0
                  })
                  box.W /= 10
                  box.H /= 10
                  box.X /= 10
                  box.Y /= 10
                  return box
                })
              })
              this.createCustomBoxesAndContainers(this.containerData, this.$refs, this.containerForEdit)
              this.containerRotatedBoxes.forEach((oneBox) => {
                oneBox.Rotated = false
              })
              this.EditQueue = 0
              this.editFinished = false
              this.loadingEdit = false
            }).catch(function (error) {
              console.log(error)
              this.loadingEdit = false
            })
          } else {
            this.notifyChooseContainer()
            this.loadingEdit = false
          }
        } else if (type === 'Swap') {
          this.containerSwapedBoxes = []
          console.log('prvi sam')
          console.log(this.firstForEdit)
          console.log('drugi sam')
          console.log(this.secondForEdit)
          _.forEach(this.containerData, (container, index) => {
            console.log(container)
            console.log('indeks prvog')
            let firstIndex = container.PackedBoxes.indexOf(this.firstForEdit)
            console.log(firstIndex)
            console.log('indeks drugog')
            let secondIndex = container.PackedBoxes.indexOf(this.secondForEdit)
            console.log(secondIndex)
            if (firstIndex !== -1 && secondIndex !== -1) {
              if (firstIndex === secondIndex) {
                console.log('usao u gresku')
                this.EditQueue = 0
                this.editFinished = false
                _.forEach(container.PackedBoxes, (box, index) => {
                  this.containerSwapedBoxes.push({'BoxID': box.ID, 'Rotated': false})
                })
              } else if (firstIndex !== secondIndex) {
                this.swap(container.PackedBoxes, container.PackedBoxes.indexOf(this.firstForEdit), container.PackedBoxes.indexOf(this.secondForEdit))
                _.forEach(container.PackedBoxes, (box, index) => {
                  this.containerSwapedBoxes.push({'BoxID': box.ID, 'Rotated': box.Rotated})
                })
                console.log('swapped')
              }
            } else {
              this.$notify.warning({
                title: 'Warning',
                message: 'Please select two pallets for swapping.'
              })
              this.EditQueue = 0
              this.editFinished = false
              _.forEach(container.PackedBoxes, (box, index) => {
                this.containerSwapedBoxes.push({'BoxID': box.ID, 'Rotated': false})
              })
              this.loadingEdit = false
            }
          })
          console.log('new cont data')
          console.log(this.containerSwapedBoxes)
          if (String(this.container).valueOf() !== '') {
            this.clearContainers()
            let obj = {
              Boxes: this.containerSwapedBoxes
            }
            Object.defineProperty(obj, 'ContainerID', {
              enumerable: true,
              configurable: true,
              writable: true,
              value: parseInt(this.container) + 1
            })
            axios.post('http://52.157.147.48:80/PackingAPI/api/v1/FillContainer', obj).then((response) => {
              this.containerData = response.data
              this.firstForEdit = {}
              this.secondForEdit = {}
              console.log('tuj sam')
              console.log(this.containerData)
              Object.assign({}, this.containerData)
              this.containerData.forEach((oneContainerData) => {
                oneContainerData.PackedBoxes.map(box => {
                  Object.defineProperty(box, 'Rotated', {
                    enumerable: true,
                    configurable: true,
                    writable: true,
                    value: false
                  })
                  Object.defineProperty(box, 'EditQueue', {
                    enumerable: true,
                    configurable: true,
                    writable: true,
                    value: 0
                  })
                  box.W /= 10
                  box.H /= 10
                  box.X /= 10
                  box.Y /= 10
                  return box
                })
              })
              this.containerRotatedBoxes.forEach((oneBox) => {
                oneBox.Rotated = false
              })
              this.createCustomBoxesAndContainers(this.containerData, this.$refs, this.containerForEdit)
              this.EditQueue = 0
              this.editFinished = false
              this.loadingEdit = false
            }).catch(function (error) {
              console.log(error)
              this.loadingEdit = false
            })
          } else {
            this.notifyChooseContainer()
            this.loadingEdit = false
          }
        } else if (this.editType === 'Remove') {
          console.log(this.value)
          this.value = []
          this.containerAfterRemoval = []
          console.log('prije skanjanja')
          console.log(this.containerRotatedBoxes)
          _.forEach(this.containerRotatedBoxes, (box, index) => {
            box.Rotated = false
            box.EditQueue = 0
            console.log(box)
            if (box.Deleted === true) {
              console.log('uklanjam')
              console.log(box.BoxID)
              console.log(box.Deleted)
            } else {
              console.log('ne uklanjam')
              console.log(box.BoxID)
              console.log(box.Deleted)
              this.value.push(box.BoxID)
              this.containerAfterRemoval.push(box)
            }
          })
          console.log('posle sklanjanja')
          console.log(this.containerAfterRemoval)
          this.containerRotatedBoxes = this.containerAfterRemoval
          console.log(this.value)
          if (String(this.container).valueOf() !== '') {
            this.clearContainers()
            let obj = {
              Boxes: this.containerAfterRemoval
            }
            Object.defineProperty(obj, 'ContainerID', {
              enumerable: true,
              configurable: true,
              writable: true,
              value: parseInt(this.container) + 1
            })
            axios.post('http://52.157.147.48:80/PackingAPI/api/v1/FillContainer', obj).then((response) => {
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
                  Object.defineProperty(box, 'Deleted', {
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
              this.createCustomBoxesAndContainers(this.containerData, this.$refs, this.containerForEdit)
              this.containerRotatedBoxes.forEach((oneBox) => {
                oneBox.Rotated = false
              })
              this.EditQueue = 0
              this.editFinished = false
              this.loadingEdit = false
            }).catch(function (error) {
              console.log(error)
              this.loadingEdit = false
            })
          } else {
            this.notifyChooseContainer()
            this.loadingEdit = false
          }
        }
      } else {
        this.$notify.error({
          title: 'Error',
          message: 'Please choose a container to edit'
        })
        this.loadingEdit = false
      }
    },
    clearSelection () {
      this.loadingClearSolution = true
      this.value = []
      this.editFinished = false
      this.EditQueue = 0
      this.clearContainers()
      this.loadingClearSolution = false
    },
    displayContainer (containerIndex) {
      console.log(this.arrayOfCanvases)
      _.forEach(this.arrayOfCanvases, (canvas, index) => {
        if (index === containerIndex) {
          console.log('stavio sam event')
          this.globalCanvasEdit = this.arrayOfCanvases[index]
          this.globalCanvasEdit.addEventListener('click', this.handleEditCanvas, false)
          this.arrayOfCanvases[index].style.display = 'block'
        } else {
          console.log('skinuo sam event')
          this.arrayOfCanvases[index].removeEventListener('click', this.handleEditCanvas, false)
          this.arrayOfCanvases[index].style.display = 'none'
        }
      })
    },
    drawContainers () {
      this.arrayOfCanvases = []
      var index = ''
      this.numberOfCont = 0
      setTimeout(() => {
        for (var key in this.$refs) {
          if (this.$refs.hasOwnProperty(key)) {
            this.numberOfCont = this.numberOfCont + 1
            index = key.split('s')[1]
            this.canvas = document.getElementById(key)
            this.arrayOfCanvases.push(this.canvas)
            this.canvas.width = this.containers[index].Width
            this.canvas.height = this.containers[index].Height
            this.context = document.getElementById(key).getContext('2d')
            this.context.font = '15px Arial'
            this.context.fillStyle = '#ff0000'
            this.context.fillText('Container: ' + this.numberOfCont, this.canvas.width / 2 - 20, this.canvas.height - 20)
            this.context.fillText(this.canvas.height, 20, this.canvas.height / 2)
            this.context.fillText(this.canvas.width, this.canvas.width / 2, 20)
          }
        }
      }, 1000)
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
        message: 'Please select a container/containers to fill'
      })
    },
    swap (arr, index1, index2) {
      var temp = arr[index2]
      arr[index2] = arr[index1]
      arr[index1] = temp
      return arr
    }
  }
}
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
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
.row-bg-center-canvas {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 96%;
  overflow-x: auto;
  margin: 2% 2%;
}
.canvas-div
{
  margin: 1em;
  width: 100%;
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
.el-radio {
  color: #4c6013;
}
.el-radio.is-bordered {
  border: 1px solid #ff5c00;
}
.el-radio.is-bordered.is-checked {
  border: 1px solid #00ff0b;
}
.el-radio__input.is-checked .el-radio__inner {
  border-color: #00ff0b;
  background: #00ff0b;
}
.el-radio__input.is-checked+.el-radio__label {
  color: #00ff0b;
}
.el-radio__inner {
  border: 1px solid #ff5c00;
}
</style>
