(function () {
    Akmii.defineNS("Akmii.Media", {
        UploadModel: Akmii.define(function () {
            var model = this;
            model.columns = "Id,,UserId,Title,FileUrl,AssetId,IsPublic,Content,VisitCount,PublishDate,Cover";
            for (var i = 0; i < model.columns.split(',').length; i++) {
                model[model.columns.split(',')[i]] = ko.observable();
            };
        },
       {

       }),
    });
})();