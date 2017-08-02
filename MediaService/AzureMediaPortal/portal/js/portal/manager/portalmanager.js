/*
Test Standard模块：Standard接口
*/
(function () {
    Akmii.defineNS("Akmii.Media", {
        PortalManager: Akmii.define(function () {
            this.serviceUrl = "";

            this.Model = Akmii.Media.MediaUploadModel;
        }, {
            //新增试运行标准
            Add: function (model) {
                return YunGalaxyJSHelper.POSTMethod(this.serviceUrl + "/TestStandard/Add", model, false);
            },
            SetCustomerValue: function (json, model) { //给旧的MODEL赋值
                for (var i = 0; i < model.columns.split(',').length; i++) {
                    model[model.columns.split(',')[i]](json[model.columns.split(',')[i]]);
                };
                return model;
            },
            StructureModel: function (json) { //构造一个全新的MODEL
                var model = new this.Model();
                return this.SetCustomerValue(json, model);
            }
        })
    });
})();