<template>
  <div id="app">
    <el-header><div class="header-text">CONTAINER PACKING</div></el-header>
    <router-view/>
  </div>
</template>

<script>
import ElHeader from '../node_modules/element-ui/packages/header/src/main'
export default {
  components: {ElHeader},
  name: 'App'
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
}
.el-header {
  background-color: #0D72B9;
  color: #ffffff;
  line-height: 5em;
  display: flex;
  align-items: center;
  justify-content: center;
}
.header-text
{
  font-size: 1.5em;
  font-weight: 800;
}
body
{
  margin: 0em;
}
</style>
