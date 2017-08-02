(function () {
    Akmii.defineNS("Akmii.Media", {
        List_VM: Akmii.define(function (otherDom, isFirst) {
            var topDom = otherDom || this;
            topDom.PageInit = function () {
                topDom.RecentDisplay = ko.observableArray();
                topDom.RecommentDisplay = ko.observableArray();
                topDom.SportDisplay = ko.observableArray();
                topDom.NewsDisplay = ko.observableArray();

                var SelectRecent = function () {
                    $.ajax({
                        type: "POST",
                        async: false,
                        url: "/Media/AllRecent",
                    }).done(function (state) {
                        $.each(state, function (index, item) {
                            topDom.RecentDisplay.push({ Id: item.Id, Cover: item.Cover, Title: item.Title, UserId: item.UserId, VisitCount: item.VisitCount+" views" })
                        });
                    }).fail(function () {
                        Consoleconsole.log('error');
                    });
                }
                SelectRecent();

                var SelectRecomment = function () {
                    $.ajax({
                        type: "POST",
                        async: false,
                        url: "/Media/AllRecomment",
                    }).done(function (state) {
                        $.each(state, function (index, item) {
                            topDom.RecommentDisplay.push({ Id: item.Id, Cover: item.Cover, Title: item.Title, UserId: item.UserId, VisitCount: item.VisitCount + " views" })
                        });
                    }).fail(function () {
                        Consoleconsole.log('error');
                    });
                }
                SelectRecomment();

                var SelectSport = function () {
                    $.ajax({
                        type: "POST",
                        async: false,
                        url: "/Media/AllSport",
                    }).done(function (state) {
                        $.each(state, function (index, item) {
                            topDom.SportDisplay.push({ Id: item.Id, Cover: item.Cover, Title: item.Title, UserId: item.UserId, VisitCount: item.VisitCount + " views" })
                        });
                    }).fail(function () {
                        Consoleconsole.log('error');
                    });
                }
                SelectSport();

                var SelectNews = function () {
                    $.ajax({
                        type: "POST",
                        async: false,
                        url: "/Media/AllNews",
                    }).done(function (state) {
                        $.each(state, function (index, item) {
                            topDom.NewsDisplay.push({ Id: item.Id, Cover: item.Cover, Title: item.Title, UserId: item.UserId, VisitCount: item.VisitCount + " views" })
                        });
                    }).fail(function () {
                        Consoleconsole.log('error');
                    });
                }
                SelectNews();
            };

            topDom.PageInit();
        }, {

            })
    });
})();



