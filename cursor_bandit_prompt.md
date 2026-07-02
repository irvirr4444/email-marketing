# Cursor build prompt: email lever contextual bandit MVP

Build a minimal, runnable contextual bandit that picks structured email levers. An LLM
renders the chosen levers into copy. Reward is synthetic for now and is the only thing
that gets swapped when real Klaviyo and Shopify outcomes exist. Build it exactly as
specified. Do not add a web server, database, queue, config framework, or CLI framework.
Plain Python files only. Everything must run from the terminal.

Use Vowpal Wabbit. It is already confirmed to install and run cb_explore_adf on Python
3.12. Do not substitute another library.

## Governing architecture (this controls every decision)

Three decoupled parts. Keeping them separate is the whole point.

    context  ->  bandit picks a lever recipe  ->  LLM renders copy
                        |
                     reward  <- the single swap point

1. The bandit picks levers, never prose. It chooses one full recipe of email levers per
   round from a candidate set, conditioned on context, and returns the propensity it
   assigned to the chosen action.
2. The LLM renders a chosen recipe into copy. It lives OUTSIDE the learning loop. The
   bandit must be able to run tens of thousands of rounds with zero LLM calls.
3. Reward is isolated in one file. Today it is synthetic. When real data lands, one
   function changes and nothing else in the system moves.

Style rule for all generated email copy: no hyphens and no em dashes in the copy text.

## File layout (create exactly these)

    bandit_mvp/
      levers.py      lever schema, recipe sampling, VW feature encoding
      bandit.py      VW cb_explore_adf wrapper: pick, learn, save
      reward.py      THE swap point: random / planted now, real later
      renderer.py    Claude renders a recipe into subject, preheader, body, cta
      run.py         the loop plus a recovery check
      README.md      how to run and where the swap point is

## levers.py

Two dictionaries and helpers.

CONTEXT (observed, not controlled, goes in the shared "|C" namespace):

    product:  peptide_serum, lip_oil, cleanser, bundle
    intent:   drive_purchase, reactivate, educate
    audience: cold, engaged, lapsed

LEVERS (controlled by the bandit, each candidate recipe is one "|A" line). Values are
taken from the Email 27 taxonomy and widened so there is something to choose between:

    framework:       aida, pas, bab, pastor, star
    emotion:         fear, hope, curiosity, belonging, pride
    persuasion:      reciprocity, scarcity, social_proof, authority, commitment, liking
    specificity:     hard_numbers, soft
    subject_type:    statement, question, curiosity_gap, how_to, list
    subject_length:  short, medium, long
    subject_casing:  title, sentence, lower
    preheader:       none, short, medium, long
    body_length:     short, medium, long
    body_links:      zero, one, multiple
    scannable:       yes, no
    social_proof:    none, result, rating, count, testimonial
    sp_placement:    none, pre_cta, post_cta, inline
    sp_specificity:  generic, specific
    cta_type:        read, buy, learn, book
    cta_style:       link, button
    cta_placement:   header, inline, footer
    offer:           none, discount, gift, bundle
    writing_style:   ogilvy, halbert, conversational, minimal

Functions:

    sample_context()          one random context dict
    sample_recipe()           one random full recipe dict
    candidate_recipes(k)      list of k recipes
    context_line(ctx)         "shared |C product=... intent=... audience=..."
    action_line(recipe)       "|A framework=... emotion=... ..."

Design so folding in the other 49 emails only touches this file: widen value lists, or
later accept per value sampling weights learned from the labelled set so candidates look
like real emails instead of uniform noise. Do not hardcode the schema anywhere else.

## bandit.py

Thin wrapper over VW. No email concepts leak in here. Use these exact VW args:

    --cb_explore_adf -q CA --interactions CA --epsilon 0.1 --quiet

The -q CA crossing is required so the policy learns "this lever value is good IN THIS
context" rather than a context free average.

Class Bandit with:

    pick(ctx, recipes)   -> (chosen_index, probability, all_probs)
        build [context_line] + [action_line per recipe], call vw.predict to get the
        exploration distribution, sample an index from it, return that index, its
        probability, and the full vector. The returned probability is the propensity and
        MUST be logged, this is what makes off policy evaluation correct on real logs.

    learn(ctx, recipes, chosen, probability, reward)
        cost = -reward because VW minimises cost. Attach the label to the chosen action
        line in the format "chosen:cost:probability " prepended to that "|A" line, then
        vw.learn the full example.

    greedy_scores(ctx, recipes) -> vw.predict, used as the exploitation view for eval
    save(path) -> vw.save

## reward.py

The only file that changes when real data arrives. Make this obvious in comments.

Provide reward(ctx, recipe, mode):

    mode="random"  -> return random.random(). Pure noise, what was requested. The bandit
                      will not improve because there is nothing to learn. That is correct.

    mode="planted" -> a hidden ground truth the bandit cannot see, used to VERIFY learning.
                      Sum planted coefficients, include a context interaction and a trap,
                      squash through a sigmoid to a rate, sample a Bernoulli 0 or 1.

Planted coefficients:

    framework:      aida 0.9, pas 0.6
    social_proof:   result 0.7, testimonial 0.6, rating 0.5
    sp_specificity: specific 0.8
    specificity:    hard_numbers 0.6
    cta_type:       buy 0.5, read 0.4
    TRAP persuasion: scarcity -0.8   (looks tempting, must be avoided)
    context interaction: if intent == reactivate, emotion == curiosity +0.6, fear -0.3

    signal squash: p = sigmoid(sum - 1.0); return 1.0 if random() < p else 0.0

Also provide real_reward(ctx, recipe) that raises NotImplementedError with a comment
block showing the intended body: look up the logged outcome of the recipe actually sent
to this contact and return a composite like:

    1.0*opened + 3.0*clicked + 12.0*ordered - 25.0*complained

Heavy complaint penalty is deliberate, it protects domain reputation.

## renderer.py

render(ctx, recipe, model="claude-sonnet-4-6") using the anthropic SDK. System prompt
instructs the model to express every lever faithfully, use no hyphens or em dashes in the
copy, and return strict JSON only with keys subject, preheader, body, cta. Read the key
from ANTHROPIC_API_KEY. Strip a leading code fence if present, then json.loads. Also
provide preview(ctx, recipe) that returns a plain text summary of context and recipe so a
recipe can be eyeballed offline with no API call. This file is never called inside the
training loop.

## run.py

CLI with argparse:

    python run.py --mode planted --rounds 20000   verify it learns, runs recovery check
    python run.py --mode random  --rounds 20000   plumbing only, stays flat near 0.5
    python run.py --render                          render one winner, needs the API key

CANDIDATES_PER_ROUND = 24.

train(mode, rounds): each round sample a context, sample candidate recipes, pick, get
reward, learn. Track a rolling average reward over the last 2000 rounds and print every
4000 rounds.

recovery_check(b): give the trained policy fresh candidate sets, take the greedy best
recipe each time, count which lever value wins across a few thousand trials, and print the
top values for framework, sp_specificity, specificity, persuasion, social_proof, cta_type.
Print the expectation line: framework favours aida, sp_specificity favours specific,
specificity favours hard_numbers, persuasion AVOIDS scarcity. This recovery check, not a
rising reward curve, is the proof the bandit is wired correctly.

render_winner(b): fix a drive_purchase context, sample 64 candidates, take the greedy
winner, print the preview, then try to render and print it, catching and reporting any
error so a missing key does not crash the run.

At the end save the policy to policy.vw.

## Acceptance checks (the build is done when all pass)

1. `pip install vowpalwabbit anthropic` succeeds.
2. `python run.py --mode random --rounds 12000` prints a rolling reward that stays flat
   near 0.5. No learning is the correct result here.
3. `python run.py --mode planted --rounds 20000` runs the recovery check and shows the
   policy exploiting toward specific for sp_specificity and hard_numbers for specificity,
   and scarcity NOT appearing in the persuasion top values.
4. The inner training loop makes zero LLM calls.
5. Swapping reward is a one function edit in reward.py. Grep confirms no other file
   imports or references the synthetic planted logic.

## Build order (each step must run before the next)

1. levers.py with the two dicts and the four helpers, plus a __main__ that prints one
   sampled context and recipe and their VW lines.
2. bandit.py plus a tiny script that predicts on a hand built 2 action example, to confirm
   VW runs.
3. reward.py, unit check both modes return sane values.
4. run.py training loop with random mode. Confirm flat reward.
5. Switch to planted mode, add recovery_check, confirm the strong levers recover.
6. renderer.py and render_winner, confirm a winner renders with a live key.
7. README.md documenting run commands and the reward.py swap point.

## Honest limits to preserve in the README

The propensity must be logged live at send time for off policy correctness. The planted
environment proves the machinery converges, not that real recipients behave like the
planted coefficients. Calibrate against the first real campaign before trusting outputs.
The weak framework signal recovers less cleanly than high leverage levers because the gap
is small and reward is stochastic, this is expected and resolves on real effect sizes.
