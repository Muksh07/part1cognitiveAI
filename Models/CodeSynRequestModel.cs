using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Models
{
    public class CodeSynRequestModel
    {
        public string? Filename { get; set; }
        public string? FileContent { get; set; }
        public int i { get; set; }
        public string DataFlow { get; set; }
        public string SolutionOverview { get; set; }
        
    }
}