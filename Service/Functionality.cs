using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GPTService.Core;
using System.Collections.Generic;
using System.Threading.Tasks.Dataflow;

namespace backend.Service
{
    public class Functionality
    {
        private int chunkSize = 2048;  // Adjust as needed
        private int contextLimit = 4096;  // Adjust as needed
        private string prompt = "";
        int GrandTotalToken = 0;


        // Properties for the Blueprinting sub-tabs
        Dictionary<string, string> details = new Dictionary<string, string>
        {            { "requirementSummary", "" },
            { "solutionOverview", "" },
            { "projectStructure", "" },
            { "dataFlow", "" },
            { "unitTesting", "" },
            { "commonFunctionalities", "" },
            { "databaseScripts", "" }
        };

        public string DataFlow = "";
        public string SolutionOvervieww = "";


        private const string llmmodel = "gpt-4o";
        private const string ApiKey = "";
        private const string ApiEndpoint = "";

        GPTService.Core.GPTService gPTService = new GPTService.Core.GPTService { };

        public async Task<string> AnalyzeBRD(string txtprompt, string strtask, int opt)
        {

            if (string.IsNullOrEmpty(txtprompt) || string.IsNullOrEmpty(strtask))
            {
                return "Please provide Business Requirement and Task to perform";
            }

            int CompletionTokens = 0;
            int PromptTokens = 0;
            int TotalTokens = 0;
            string finalSummary = "";
            try
            {
                string context = "";
                chunkSize = (contextLimit * 3) - 100;
                if (chunkSize > 0 && contextLimit > 0)
                {
                    List<string> chunks = gPTService.SplitTextIntoChunks(txtprompt, chunkSize);
                    var summaries = new List<string>();

                    foreach (var chunk in chunks)
                    {
                        prompt = gPTService.BuildPrompt(context, strtask, chunk);
                        var _APIResponse = await gPTService.GetChatGPTResponseAsync(contextLimit, prompt, ApiKey, ApiEndpoint, llmmodel);

                        if (_APIResponse == null || string.IsNullOrEmpty(_APIResponse.Response))
                        {
                            throw new Exception("API response is null or empty");
                        }

                        summaries.Add(_APIResponse.Response);

                        context += "\n" + _APIResponse.Response;

                        CompletionTokens += _APIResponse.CompletionTokens;
                        PromptTokens += _APIResponse.PromptTokens;
                        TotalTokens += _APIResponse.TotalTokens;
                    }

                    GrandTotalToken += TotalTokens;
                    finalSummary = string.Join("\n\n", summaries);

                }

            }
            catch (Exception ex)
            {
                finalSummary = $"Error: {ex.Message}";
            }

            return finalSummary;
        }


        public Dictionary<string, string> GenerateBluePrintDetails(string RequirementSummary, string strSolidification)
        {
            string[] separatingStrings = new string[] { };
            if (strSolidification.Contains("1. solution overview:"))
            {
                //separatingStrings = new string[] { "1. solution overview:", "2. solution structure:", "3. data flow:", "4. unit testing details:", "5. common functionalities:" };
                separatingStrings = new string[] { "1. solution overview:", "2. solution structure:", "3. data flow:", "4. common functionalities:" };

            }
            else if (strSolidification.Contains("1. solution overview"))
            {
                //separatingStrings = new string[] { "1. solution overview", "2. solution structure", "3. data flow", "4. unit testing details", "5. common functionalities" };
                separatingStrings = new string[] { "1. solution overview", "2. solution structure", "3. data flow", "4. common functionalities" };

            }
            else if (strSolidification.Contains("solution overview:"))
            {
                //separatingStrings = new string[] { "solution overview:", "solution structure:", "data flow:", "unit testing details:", "common functionalities:" };
                separatingStrings = new string[] { "solution overview:", "solution structure:", "data flow:", "common functionalities:" };

            }
            else if (strSolidification.Contains("solution overview"))
            {
                //separatingStrings = new string[] { "solution overview", "solution structure", "data flow", "unit testing details", "common functionalities" };
                separatingStrings = new string[] { "solution overview", "solution structure", "data flow", "common functionalities" };

            }
            string[] BluePrintDetails = strSolidification.Split(separatingStrings, StringSplitOptions.RemoveEmptyEntries);

            int icount = BluePrintDetails.Length;

            for (int i = 0; i < icount; i++)
            {
                var strKeyPoint = BluePrintDetails[i].Trim();

                switch (i)
                {
                    case 0:

                        // rchSolutionOverview.Text = strKeyPoint;
                        details["solutionOverview"] = strKeyPoint;
                        SolutionOvervieww = details["solutionOverview"];

                        break;
                    case 1:
                        details["projectStructure"] = strKeyPoint;

                        break;
                    case 2:
                        // rchDataFLow.Text = strKeyPoint;
                        details["dataFlow"] = strKeyPoint;
                        DataFlow = details["dataFlow"];
                        break;
                    //case 3:
                    //    rchUnitTesting.Text = strKeyPoint;
                    //    break;
                    case 3:
                        //rchCommFunc.Text = strKeyPoint;
                        details["commonFunctionalities"] = strKeyPoint;
                        break;
                }
            }
            return details;

        }



        public string GetPromptText(string filename, string filecontent, string Dataflow, string solutionOverview)
        {
            string promptText;
            //TreeNode tn = trvSolutionStructure.SelectedNode;

            // if ((tn.Level == 3 || tn.Level == 4) && rchSolutionOverview.Text.Trim() != "" && rchDataFLow.Text.Trim() != "")
            // {
            //     // string FileName = tn.Text;
            //     // string FileDetails = tn.Tag.ToString();
            //     // string SolutionOverview = rchSolutionOverview.Text.Trim();
            //     // string DataFLow = rchDataFLow.Text.Trim();
            //     string FileName = "";
            //     string FileDetails = "";
            //     string SolutionOverview = details["solutionOverview"].Trim();
            //     string DataFLow = details["dataFlow"].Trim();

            //     //lblFilename.Text = "File for code generation:" + FileName;

            //     promptText = "Solution Overview:\n" + SolutionOverview + "\nData Flow:\n" + DataFLow +
            //         "\nFile Name:\n" + FileName + "\nFile Metadata:\n" + FileDetails;
            // }
            string FileName = filename;
            string FileDetails = filecontent;
            string SolutionOverview = solutionOverview;
            string DataFLow = Dataflow;

            //lblFilename.Text = "File for code generation:" + FileName;

            promptText = "Solution Overview:\n" + SolutionOverview + "\nData Flow:\n" + DataFLow +
                "\nFile Name:\n" + FileName + "\nFile Metadata:\n" + FileDetails;

            //string strtask = "Generate code refer Solution Overview,Data Flow,File Name, File Metadata and using technology specified in the File Metadata";
            return promptText;
        }

        public List<object> getDetails(string name, string content, int k)
        {
            return [name, content, k];
        }
    }
}
