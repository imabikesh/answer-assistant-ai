<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Read uploaded papers in server-only modules using in-memory worker-compatible parsers; this avoids exposing document parsing or secrets to browsers.
- Split read/solve work into bounded typed server-function calls and retain completed chunks client-side for retry; this keeps long papers from one oversized request.
- Keep the AI access breaker in a service-only table and require owner-side clearance after restored access; this prevents denied requests from replaying across reloads.
- Keep demo sets as explicit samples only, never as an automatic error fallback; students must not receive unrelated answers.
