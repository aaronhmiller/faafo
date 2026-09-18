import { defineConfig } from "@coderabbitai/config"

export default defineConfig({
  language: "en-US",
  reviews: {
    profile: "chill",
    poem: true,
    request_changes_workflow: true,
    pre_merge_checks: {
      custom_checks: {
         name: "No exposed secrets",
         mode: "error",
         instructions: 
            "Fail if the diff contains an API key, token, password, or other secret."
      },
    },
  },
})
