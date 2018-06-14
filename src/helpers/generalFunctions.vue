<script>
export default {
  methods: {
    notifyChooseContainer () {
      this.$notify.error({
        title: 'Error',
        message: 'Please choose a container to fill'
      })
    }
  }
}
</script>
