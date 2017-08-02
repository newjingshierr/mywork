using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace AzureMediaPortal.Models
{
    public class MediaElement
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string Title { get; set; }
        public string FileUrl { get; set; }
        public string AssetId { get; set; }
        public bool IsPublic { get; set; }
        public string Content { get; set; }
        public int VisitCount { get; set; }
        public DateTime PublishDate { get; set; }
        public string Cover { get; set; }
        /// <summary>
        /// 类型：sport||news
        /// </summary>
        public string Category { get; set; }

    }

    public class ViewMediaElement
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string Title { get; set; }
        public string FileUrl { get; set; }
        public string AssetId { get; set; }
        public bool IsPublic { get; set; }
        public string Content { get; set; }
        public int VisitCount { get; set; }
        public string PublishDate { get; set; }
        public string Cover { get; set; }
        /// <summary>
        /// 类型：sport||news
        /// </summary>
        public string Category { get; set; }
    }

}