<template>
  <div class="con">
    <el-button type="info" size="mini" @click="handlePropsEdit(rowData)">
      {{ $t("properties") }}
    </el-button>

    <el-dialog :title="$t('prop_editor')" :visible.sync="editPropModal">
      <el-row>
        <el-col :span="8">
          <el-popconfirm
            :title="$t('reset_props')"
            :confirm-button-text="$t('yes')"
            :cancel-button-text="$t('no')"
            @onConfirm="handleResetConfig"
          >
            <el-button slot="reference" type="danger">{{ $t('delete_all_props') }}</el-button>
          </el-popconfirm>
        </el-col>
        <el-col :span="8">
          <el-button type="primary" @click="handleSelectProps">{{ $t('add_prop') }}</el-button>
        </el-col>

        <el-col :span="8">
          <el-button type="primary" @click="handleAuxProps">{{ $t('aux_prop') }}</el-button>
        </el-col>
      </el-row>

      <el-divider />

      <div v-if="addingAuxProps || auxProps.length > 0">
        <div v-for="(prop, index) in auxProps" :key="index">
          <el-row :gutter="16">
            <el-col :offset="1" :span="7">
              <div class="sub-title">Auxiliary Property Name</div>
              <el-input v-model="prop.name" placeholder="Auxiliary Property Name" clearable />
            </el-col>

            <el-col :span="8">
              <div class="sub-title">Auxiliary Property Value</div>
              <el-input v-model="prop.value" placeholder="Auxiliary Property Value" clearable />
            </el-col>

            <el-col :span="4" :offset="3">
              <el-button @click="handleDeleteAuxProp(index)">Delete</el-button>
            </el-col>
          </el-row>

          <el-divider />
        </div>
      </div>

      <form-create v-model="propsData" :rule="ruleShow" :option="option" />

      <el-button v-if="ruleShow.length" class="cancel__btn" @click="handleCancelPropEdit">
        Cancel
      </el-button>
      <el-row v-else>
        <el-button @click="handleCancelPropEdit">Cancel</el-button>
        <el-button type="primary" @click="handleResetConfig">Submit</el-button>
      </el-row>
    </el-dialog>

    <el-dialog :title="$t('select_editor')" :visible.sync="selectPropModal">
      <el-select v-model="selectedProps" filterable clearable placeholder="Please Select" size="medium" class="my_select" @change="handleSelect">
        <el-option
          v-for="item in rule.filter(el => !el.show)"
          :key="item.field"
          :label="item.title"
          :value="item.field"
        />
      </el-select>
    </el-dialog>
  </div>
</template>
<script>
import { handlePropsToFormOption } from "@/utils"

export default {
  name: 'PropertyEditor',
  props: {
    rowData: {
      type: Object,
      require: true,
      default: () => ({})
    },
    type: {
      type: String,
      require: true,
      default: ""
    }
  },
  data() {
    return {
      rule: [],
      ruleShow: [],
      editPropModal: false,
      selectPropModal: false,
      selectedProps: "",
      addingAuxProps: false,
      auxProps: [],
      auxPropsSnapshot: [],
      normalPropsSnapshot: [],
      propsData: {}, // Property Editor Data
      option: { // Property Editor Option
        row: {
          gutter: 16
        },

        onSubmit: (formData) => {
          this.submitPropData(formData)
        },
        submitBtn: {
          innerText: "Submit"
        }
      }
    }
  },
  watch: {
    rule: function(val) {
      this.ruleShow = val.filter(e => e.show).map(e => (
        {
          type: 'div',
          field: `${e.field}_lorem`,
          children: [{
            type: 'ElRow',
            children: [
              {
                type: 'ElCol',
                props: {
                  offset: 1,
                  span: 16
                },
                children: [
                  e
                ]
              },
              {
                type: 'ElCol',
                props: {
                  offset: 3,
                  span: 4
                },
                children: [
                  {
                    type: 'button',
                    children: ['Delete'],
                    on: {
                      click: () => { // 删除某一项
                        this.propsData.removeField(`${e.field}_lorem`)
                        this.propsData.removeField(e.field)
                      }
                    }
                  }
                ]
              }
            ]
          },
          {
            type: 'ElDivider'
          }]
        }
      ))
    }
  },
  created() {
    this.rule = handlePropsToFormOption(this.type, JSON.parse(JSON.stringify(this.rowData)).props)
  },
  methods: {
    handleAuxProps() { // 点击添加自定义属性
      this.addingAuxProps = true
      this.auxProps.push({
        name: '',
        value: ''
      })
    },
    handleDeleteAuxProp(index) { // 删除自定义属性
      this.auxProps.splice(index, 1)
    },
    handlePropsEdit(rowData) { // 编辑提交
      rowData = JSON.parse(JSON.stringify(rowData))
      console.log(rowData)
      this.current = rowData
      this.editPropModal = true
      this.$emit('handlePropsEdit', rowData)
      this.rule = handlePropsToFormOption(this.type, rowData.props)
      this.auxProps = [] // 反显自定义属性 [{name: '', value: ''}]
      this.auxPropsSnapshot = []
      const ruleShowMap = this.ruleShow.map(el => el.field.replace('_lorem', ''))
      for (const propsKey in rowData.props) {
        const strings = propsKey.split('/')
        const first = strings.shift()
        if (strings.length > 0 && first === 'Aux') {
          this.auxProps.push({
            name: strings.join("/"),
            value: rowData.props[propsKey]
          })
          this.auxPropsSnapshot.push({
            name: strings.join("/"),
            value: rowData.props[propsKey]
          })
        } else if (ruleShowMap.indexOf(propsKey) > -1) { // handle normal options
          this.normalPropsSnapshot.push({
            name: propsKey,
            value: rowData.props[propsKey]
          })
        }
      }
    },
    handleSelectProps() { // 选择属性
      this.selectPropModal = true
    },
    handleSelect(val) { // 处理单个添加的属性
      this.rule = this.rule.map(el => el.field === val ? { ...el, show: true } : el)
      this.selectPropModal = false
      this.selectedProps = ""
    },
    handleCancelPropEdit() { // 取消编辑
      this.editPropModal = false
      this.auxProps = [] // 重置时需要将临时数据清空
    },
    handleResetConfig() { // 重置（删除）所有属性
      console.log(this.auxProps, 'this.auxProps')

      const deleteProps = this.ruleShow.map(e => e.field)

      const data = {
        override_props: {},
        delete_props: []
      }

      deleteProps.map(it => it.replace('_lorem', '')).forEach((it) => {
        data.delete_props.push(it)
      })

      if (this.auxProps.length) {
        this.auxProps.forEach(it => {
          data.override_props[`Aux/${it.name}`] = it.value
        })
      } else {
        this.auxPropsSnapshot.forEach(it => {
          const res = this.auxProps.find(item => item.name === it.name)
          if (typeof res === "undefined") {
            data.delete_props.push(`Aux/${it.name}`)
          }
        })
      }

      this.normalPropsSnapshot.forEach(it => {
        data.delete_props.push(it.name)
      })

      this.$emit('handleSubmit', data, () => {
        this.editPropModal = false
      })
    },
    submitPropData(formData) { // 保存所有属性
      const data = {
        override_props: {},
        delete_props: []
      }

      Object.keys(formData).filter(it => !/_lorem$/.test(it)).forEach((it) => {
        data.override_props[it] = formData[it]
      })

      this.auxPropsSnapshot.forEach(it => {
        const res = this.auxProps.find(item => item.name === it.name)
        if (typeof res === "undefined") {
          data.delete_props.push(`Aux/${it.name}`)
        }
      })

      console.log(this.normalPropsSnapshot, 'this.normalPropsSnapshot')
      console.log(formData, 'formData')

      this.normalPropsSnapshot.forEach(it => {
        if (!(it.name in formData)) {
          data.delete_props.push(it.name)
        }
      })

      if (this.auxProps.length) {
        this.auxProps.forEach(it => {
          data.override_props[`Aux/${it.name}`] = it.value
        })
      }

      console.log(data, 'submitPropData data')

      this.$emit('handleSubmit', data, () => {
        this.editPropModal = false
      })
    }
  }
}
</script>

<style scoped>
.con {
  text-align: left;
  display: inline-block;
  margin-right: 1em;
}

.cancel__btn {
  position: relative;
  top: -4.1em;
}

.sub-title {
  font-weight: 700;
}

.my_select {
  min-width: 20rem;
}
</style>
