<template>
  <el-transfer
    v-model="value"
    :data="data"
    :titles="titles">
  </el-transfer>
</template>

<script>
export default {
  props: ['value', 'data', 'titles']
}
</script>
