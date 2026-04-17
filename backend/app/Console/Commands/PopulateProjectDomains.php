<?php

namespace App\Console\Commands;

use App\Models\Project;
use Illuminate\Console\Command;

class PopulateProjectDomains extends Command
{
    protected $signature = 'projects:populate-domains';
    protected $description = 'Populate domain field for projects based on their tasks';

    public function handle(): int
    {
        $projects = Project::with('tasks')->get();
        $updated = 0;

        foreach ($projects as $project) {
            if ($project->domain) {
                continue;
            }

            $areas = $project->tasks->pluck('area')->filter()->toArray();
            if (empty($areas)) {
                continue;
            }

            $areaCounts = array_count_values($areas);
            arsort($areaCounts);
            $mostCommonArea = array_key_first($areaCounts);

            if ($mostCommonArea) {
                $project->update(['domain' => $mostCommonArea]);
                $this->info("Updated project '{$project->title}' with domain: {$mostCommonArea}");
                $updated++;
            }
        }

        $this->info("Updated {$updated} projects with domains.");
        return 0;
    }
}
