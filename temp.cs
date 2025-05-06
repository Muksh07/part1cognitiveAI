public async Task<APIResponse> GetChatGPTResponseAsync(int contextLimit, string question, string endpoint, string llmmodel)
{
    string generatedcontent2 = "";
    List<string> FinalContents = new List<string>();
    string QUESTION = question;
    APIResponse _APIResponse = new APIResponse
    {
        Response = "",
        CompletionTokens = 0,
        PromptTokens = 0,
        TotalTokens = 0
    };

    string finishresponse = "";

    // Authenticate using DefaultAzureCredential (you can also use ClientSecretCredential)
    var credential = new DefaultAzureCredential(); // Use this in local dev if managed identity is not available
    var tokenRequestContext = new TokenRequestContext(new[] { "https://cognitiveservices.azure.com/.default" });
    var accessToken = await credential.GetTokenAsync(tokenRequestContext);

    using (HttpClient httpClient = new HttpClient())
    {
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken.Token);

        while (true)
        {
            var payload = new
            {
                model = llmmodel,
                messages = new[]
                {
                    new
                    {
                        role = "user",
                        content = QUESTION
                    }
                },
                temperature = 0.7,
                top_p = 0.95,
                stream = false
            };

            HttpResponseMessage response = await httpClient.PostAsync(
                endpoint,
                new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json")
            );

            if (response.IsSuccessStatusCode)
            {
                dynamic responseObject = JsonConvert.DeserializeObject<object>(await response.Content.ReadAsStringAsync());
                if (responseObject != null)
                {
                    if (((Array)responseObject.choices).Length > 0)
                    {
                        finishresponse = ((string)responseObject.choices[0].finish_reason).Trim();
                        generatedcontent2 = ((string)responseObject.choices[0].message.content).Trim();

                        FinalContents.Add(generatedcontent2);
                        _APIResponse.Response = generatedcontent2;
                        dynamic usageproperty = responseObject.usage;
                        _APIResponse.FinishReason = finishresponse;
                        _APIResponse.CompletionTokens = (int)usageproperty.completion_tokens;
                        _APIResponse.PromptTokens = (int)usageproperty.prompt_tokens;
                        _APIResponse.TotalTokens = (int)usageproperty.total_tokens;

                        if ((finishresponse.ToLower() == "length"))
                        {
                            int strlenH = generatedcontent2.Length;
                            int startIndex = ((strlenH > 100) ? (strlenH - 100) : 0);
                            QUESTION = " continue from : " + generatedcontent2.Substring(startIndex);
                        }
                        else
                        {
                            break;
                        }
                    }
                }
            }
            else
            {
                generatedcontent2 = response.StatusCode.ToString() + " ---- " + response.ReasonPhrase;
                FinalContents.Add(generatedcontent2);
                break;
            }
        }
    }

    generatedcontent2 = string.Join("\n", FinalContents);
    _APIResponse.Response = generatedcontent2;
    return _APIResponse;
}
