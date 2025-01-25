using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using GPTService.Core;
using backend.Service;
using System.Collections;
using Newtonsoft.Json.Serialization;
using System.Linq.Expressions;
using Newtonsoft.Json;


namespace backend.Controllers.BRD
{

    [ApiController]
    [Route("api/[controller]")]
    public class BRDAnalyzerController : ControllerBase
    {

        private readonly HttpClient _httpClient;
        GPTService.Core.GPTService gPTService = new GPTService.Core.GPTService { };
        Functionality _functionality = new Functionality();
        public BRDAnalyzerController(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        [HttpPost("analyse")]
        public async Task<IActionResult> AnalyzeBRD([FromBody] BRDRequestModel request)
        {
            //Console.WriteLine("BRD :",request.brdContent);
            if (string.IsNullOrEmpty(request.brdContent) || string.IsNullOrEmpty(request.task))
            {
                return BadRequest("Please provide Business Requirement and Task to perform");
            }
            try
            {
                string strtask = request.task.Trim().ToLower();
                if (strtask.StartsWith("new:"))
                {
                    strtask = request.task.Trim();
                }
                else
                {
                    strtask = request.task.Trim() + "and provide solution with project folder, file structure , provide response without any extra symbols but bulleted points, using format\r\n";
                }

                var result = await _functionality.AnalyzeBRD(request.brdContent, strtask + gPTService.GetPromptTask(0), 0);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }





        [HttpPost("solidify")]
        public async Task<ActionResult<SolidificationResponseModel>> SolidifyBRD([FromBody] SolidificationRequestModel request)
        {
            if (string.IsNullOrEmpty(request.AnalysisResult))
            {
                return BadRequest("Please provide Business Requirement and Task to perform");
            }
            try
            {
                //var variable = gPTService.GetPromptTask(1);

                var result = await _functionality.AnalyzeBRD(request.AnalysisResult, gPTService.GetPromptTask(1), 1);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }


        [HttpPost("BluePrinting")]
        public async Task<ActionResult<SolidificationResponseModel>> Blueprinting([FromBody] SolidificationResponseModel request)
        {
            if (string.IsNullOrEmpty(request.SolidificationOutput))
            {
                return BadRequest("Please provide Business Requirement and Task to perform");
            }
            try
            {
                //summary

                string RequirementSummary = await _functionality.AnalyzeBRD(request.SolidificationOutput, gPTService.GetPromptTask(2), 2);

                var result = _functionality.GenerateBluePrintDetails("summary", request.SolidificationOutput.Trim().ToLower());

                result["requirementSummary"] = RequirementSummary;

                //Unit Testing
                var prompttext = "Solution Overview:\n" + result["solutionOverview"].Trim() + "\nProject Structure:\n" + result["projectStructure"].Trim();
                string unitTesting = await _functionality.AnalyzeBRD(prompttext, gPTService.GetPromptTask(5), 2);
                result["unitTesting"] = unitTesting;

                // Database Script
                var prompttext2 = "Solution Overview:\n" + result["solutionOverview"].Trim() + "\n Project Structure:\n" + result["projectStructure"].Trim();
                string dbscripts = await _functionality.AnalyzeBRD(prompttext, gPTService.GetPromptTask(3), 2);
                result["databaseScripts"] = dbscripts;



                //Console.WriteLine("temp",temp);
                //var jsonPrompt = "Create folder tree structure and return response in json format";
                //result["projectStructure"] =  await _functionality.AnalyzeBRD(temp, jsonPrompt, 0);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }


        // [HttpPost]
        // [Route("CodeSynthesis")]
        // public async Task<ActionResult<string>> CodeSynthesis([FromBody] CodeSynthesisRequestModel requestModel)
        // {

        //     var v = _functionality.getDetails(requestModel.Filename,requestModel.FileContent,requestModel.I);
        //     Console.WriteLine("before try Filename:", v[0].ToString());
        //     Console.WriteLine("before try Content:", v[1].ToString());

        //     try
        //     {
        //         string generatedCode = string.Empty;
        //         switch (requestModel.I)
        //         {
        //             case 0:
        //                 var prompttext0 = _functionality.GetPromptText(requestModel.Filename, requestModel.FileContent);
        //                 Console.WriteLine("prompttext0", prompttext0);
        //                 generatedCode = await _functionality.AnalyzeBRD(prompttext0, gPTService.GetPromptTask(4), 3);
        //                 break;

        //             case 1:  // DataBase
        //                 var prompttext1 = _functionality.GetPromptText(requestModel.Filename, requestModel.FileContent);
        //                 Console.WriteLine("prompttext1", prompttext1);
        //                 generatedCode = await _functionality.AnalyzeBRD(prompttext1, gPTService.GetPromptTask(6), 3);
        //                 break;

        //             case 2:   // Unit testing
        //                 var prompttext2 = _functionality.GetPromptText(requestModel.Filename, requestModel.FileContent);
        //                 Console.WriteLine("prompttext2", prompttext2);
        //                 generatedCode = await _functionality.AnalyzeBRD(prompttext2, gPTService.GetPromptTask(7), 3);
        //                 break;

        //             case 3:  // Describe the code
        //                 var prompttext3 = requestModel.FileContent;
        //                 Console.WriteLine("prompttext3", prompttext3);
        //                 generatedCode = await _functionality.AnalyzeBRD(prompttext3, gPTService.GetPromptTask(8), 3);
        //                 break;

        //             default:
        //                 return BadRequest("Invalid case value");
        //         }

        //         Console.WriteLine("generatedcode", generatedCode);
        //         return Ok(generatedCode);
        //     }
        //     catch (Exception ex)
        //     {
        //         return StatusCode(500, $"Internal server error: {ex.Message}");
        //     }
        // }


        // [HttpPost("CodeSynthesis")]
        // public async Task<ActionResult<CodeSynthesisRequestModel>> CodeSynthesis([FromBody] CodeSynthesisRequestModel requestModel)
        // {
        //     Console.WriteLine("Received JSON request");

        //     try
        //     {
        //         // Start the recursive traversal
        //         await TraverseAndUpdateFolderStructure(requestModel.FolderStructure);

        //         return Ok(requestModel);
        //     }
        //     catch (Exception ex)
        //     {
        //         Console.WriteLine($"Exception: {ex.Message}");
        //         Console.WriteLine($"Stack Trace: {ex.StackTrace}");
        //         return StatusCode(500, $"Internal server error: {ex.Message}");
        //     }
        // }

        // private async Task TraverseAndUpdateFolderStructure(FolderNode node, int level = 0, string parentfolder = "")
        // {
        //     Console.WriteLine($"Traversing: {node.Name}, Level: {level}, Current Parent Folder: {parentfolder}");

        //     // Check if we're at level 2 and it's a folder named 'DataScripting' or 'UnitTest'
        //     if (node.Type == "folder" && level == 2)
        //     {
        //         if (node.Name == "DataScripting")
        //         {
        //             parentfolder = "DataScripting";
        //             Console.WriteLine($"Found DataScripting folder at level 2, setting parentfolder to {parentfolder}");
        //         }
        //         else if (node.Name == "UnitTest")
        //         {
        //             parentfolder = "UnitTest";
        //             Console.WriteLine($"Found UnitTest folder at level 2, setting parentfolder to {parentfolder}");
        //         }
        //         else
        //         {
        //             Console.WriteLine($"At level 2, but folder name does not match: {node.Name}");
        //         }
        //     }

        //     // Process file based on the parentfolder
        //     if (node.Type == "file")
        //     {
        //         try
        //         {
        //             string prompttext = _functionality.GetPromptText(node.Name, node.Content);
        //             Console.WriteLine($"Prompt Text: {prompttext}");

        //             int promptTaskId = parentfolder switch
        //             {
        //                 "UnitTest" => 7,
        //                 "DataScripting" => 6,
        //                 _ => 4
        //             };

        //             var generatedCode = await _functionality.AnalyzeBRD(prompttext, gPTService.GetPromptTask(promptTaskId), 3);
        //             node.Expanded = false;
        //             node.Code = generatedCode;

        //             Console.WriteLine($"Processed {parentfolder} file: {node.Name} at level {level}");
        //         }
        //         catch (Exception fileEx)
        //         {
        //             Console.WriteLine($"Error processing file {node.Name}: {fileEx.Message}");
        //             Console.WriteLine($"Stack Trace: {fileEx.StackTrace}");
        //         }
        //     }

        //     // Recursively traverse children
        //     if (node.Children != null)
        //     {
        //         foreach (var child in node.Children)
        //         {
        //             await TraverseAndUpdateFolderStructure(child, level + 1, parentfolder);
        //         }
        //     }
        // }



        [HttpPost("CodeSyn")]
        public async Task<IActionResult> CodeSynth([FromBody] CodeSynRequestModel requestModel)
        {  
            // var v = _functionality.getDetails(requestModel.Filename,requestModel.FileContent,requestModel.i);
            // Console.WriteLine("before try Filename:", v[0].ToString());
            // Console.WriteLine("before try Content:", v[1].ToString());

            try
            {
                string generatedCode = string.Empty;
                switch (requestModel.i)
                {
                    case 0:
                        var prompttext0 = _functionality.GetPromptText(requestModel.Filename, requestModel.FileContent,requestModel.DataFlow, requestModel.SolutionOverview);
                        //Console.WriteLine("prompttext0", prompttext0);
                        
                        generatedCode = await _functionality.AnalyzeBRD(prompttext0, gPTService.GetPromptTask(4), 3);
                        return Ok(generatedCode);

                    case 1:  // DataBase
                        var prompttext1 = _functionality.GetPromptText(requestModel.Filename, requestModel.FileContent,requestModel.DataFlow, requestModel.SolutionOverview);
                        //Console.WriteLine("prompttext1", prompttext1);
                        generatedCode = await _functionality.AnalyzeBRD(prompttext1, gPTService.GetPromptTask(6), 3);
                        return Ok(generatedCode);

                    case 2:   // Unit testing
                        var prompttext2 = _functionality.GetPromptText(requestModel.Filename, requestModel.FileContent,requestModel.DataFlow, requestModel.SolutionOverview);
                        //Console.WriteLine("prompttext2", prompttext2);
                        generatedCode = await _functionality.AnalyzeBRD(prompttext2, gPTService.GetPromptTask(7), 3);
                        return Ok(generatedCode); 

                    case 3:  // Describe the code
                        var prompttext3 = requestModel.FileContent;
                        //Console.WriteLine("prompttext3", prompttext3);
                        generatedCode = await _functionality.AnalyzeBRD(prompttext3, gPTService.GetPromptTask(8), 3);
                        return Ok(generatedCode);

                    default:
                        return BadRequest("Invalid case value");
                }

                //Console.WriteLine("generatedcode", generatedCode);
                return Ok(generatedCode);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

    }
}




