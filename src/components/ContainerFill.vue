<template>
  <div>
    <span class="chooseContainer">Choose container to fill:</span>
    <el-select style="float: right;" :change="emitContainer" multiple placeholder="Select container">
      <el-option
        v-for="(item, index) in containers"
        :key="item.ID"
        :value="index"
      >
        <span style="float: left; color: #0000ff">{{ item.ID }}</span>
        <span style="float: right; color: #ff0000; font-size: 13px">W: {{ item.Width }}, H: {{ item.Height }}, T: {{  item.Type}}</span>
      </el-option>
    </el-select>
  </div>
</template>

<script>
export default {
  props: ['containers', 'container'],
  methods: {
    emitContainer: (container) => {
      this.$emit('selectedContainer', container)
    }
  }
}
</script>
