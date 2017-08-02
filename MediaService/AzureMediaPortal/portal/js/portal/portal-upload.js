/*
portal upload模块：upload页面
*/
(function () {
    Akmii.defineNS("Akmii.Media", {
        PortalUpload_VM: Akmii.define(function (otherDom, isFirst) {
            var topDom = otherDom || this;
            topDom.ManagerInit = function () { //创建所所有的管理对象
                topDom.PortalManager = new Akmii.Media.PortalManager();
            };

            topDom.PageModelInit = function () { //页面模型初始化
                topDom.UploadModel = ko.observable(new Akmii.Media.UploadModel());
            };

            topDom.Load = function () {
                alert("测试!");
            };

            topDom.beginUpload = function () {
                //开始上传操作

            }

            topDom.PageInit = function () {
                topDom.ManagerInit();
                topDom.PageModelInit();
                topDom.Load();
            };

            topDom.PageInit();
        }, {

            })
    });
})();